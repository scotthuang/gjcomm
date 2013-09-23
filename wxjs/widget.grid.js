/**
 * WXJS.UI.GRID 微信itil展示型表格组件
 * @version 1.0
 * @author scotthuang
 * @param opt object 表格配置数组
 * @return object 表格引用
 * @desc 要注意：1、代码与jquery耦合，使用请注意在WXJS.TOOL中更改工具方法 2、css需要关联bootstrap
 * @example
 *	var opt = {
 *		//表格id
 *		id: 'testGrid',
 *		//表格渲染目标
 *		render: 'box',
 *		//表格标题
 *		title: '我的好表格',
 *		//数据字段map
 *		map: [
 *			{'index': 'id'},
 *			{'index': 'data', 'name': '数据'},
 *			{'index': 'id', 'name': '这是渲染列', renderer: function(val){
 *				return val + 'xxx';
 *			}},
 *			{'index': 'id', 'name': '操作', renderer: function(val){
 *				return '<span><a href="javascript:void(0)">查看详情</a></span>';
 *			}}
 *		],
 *		//后台cgi
 *		ajaxUrl: 'http://scotthuang.qq.com/boot/cgi/data.php',
 *		//分页大小
 *		pageSize: 15
 *	}
 *	
 *	var myGrid = WXJS.UI.GRID.create(opt);
 */

var WXJS = WXJS || {};

WXJS.UI = WXJS.UI || {};
WXJS.UI.GRID = (function(){
	var _commonStyle = 'table table-bordered table-striped',
		_tpl = '<div id="<%gridID%>"><div id="<%gridID%>_GridBox" class="wxGridTop"><div id="<%gridID%>_GridTitle" class="wxGridTitle">表格标题</div><div id="<%gridID%>_mask" class="loadMask"><div class="loadInfo"><img src="http://wx.itil.com/image/ajax-loader-3.gif">正在加载中，请稍后</div></div></div><div id="<%gridID%>_PageBar" class="wxGridBottom"><span id="<%gridID%>_PageInfo">当前第 <span id="<%gridID%>_CurrentPage">1</span> 页(第 <span id="<%gridID%>_PageStart">1</span> 条到第 <span id="<%gridID%>_PageLimit">20</span> 条)，共 <span id="<%gridID%>_TotalPage">234</span> 页(总共<span id="<%gridID%>_TotalCount">10086</span> 条记录)</span><span class="wxPager"><ul class="pager wxPagerNormalGroup"><li><a id="<%gridID%>_Previous" href="javascript:void(0)">上一页</a></li><li><a id="<%gridID%>_Next" href="javascript:void(0)">下一页</a></li></ul><span class="goPager"><input id="<%gridID%>_SetPage" type="text" class="form-control wxPagerInput"><button id="<%gridID%>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button></span></span></div></div>';

	var grid = function(opt){
		var dom = null;

		//更改this引用
		var me = this;

		//渲染目标不存在则返回
		dom = (typeof opt['render'] == 'string') ? WXJS.TOOL.$(opt['render']) : (typeof opt['render'] == 'object') ? opt['render'] : null;
		if(dom == null) return;

		//初始化配置项
		me.init(opt);

		//渲染主框架
		me.renderTpl(dom);

		//初始化表格
		me.gridInit();

		//初始化分页
		me.pageInit();

		//初始化数据
		grid.reload();

		//提供API or 提供完整对象? That is a question.
		return me;
	}

	/**
	 * 表格所有私有成员
	 */
	grid.config = {
		id: '',
		data: [],
		map: [],
		ajaxUrl: 'data.js',
		ajaxPost: {},

		pageSize: 20,
		totalCount: 10086,
		currentPage: 1,

		//基本查询对象
		baseParams: {}
	};

	/**
	 * 渲染表格框架
	 */
	grid.renderTpl = function(dom){
		dom.innerHTML = _tpl.replace(/<%gridID%>/g, this._getConfig('id'));
	}

	/**
	 * 表格配置项
	 */
	grid.init = function(opt){
		this._setConfig('id', opt.id);
		this._setConfig('map', opt.map);
		this._setConfig('ajaxUrl', opt.ajaxUrl);
		this._setConfig('pageSize', opt.pageSize);
		this._setConfig('title', opt.title);

		//设置遮罩id
		this._setConfig('maskId', [opt.id, '_mask'].join(''));
	}

	/**
	 * 初始化：
	 * 1、生成表格框架(table thead tbody)
	 * 2、填thead数据
	 * 3、渲染表格入dom
	 * 备注
	 * 这里要封装js底层方法
	 */
	grid.gridInit = function(){
		var buff = document.createDocumentFragment();
		var table = document.createElement('table');
		var thead = document.createElement('thead');
		var tbody = document.createElement('tbody');

		table.id = this._getConfig('id');
		table.className = _commonStyle;
		thead.innerHTML = this._generateThead(this._getConfig('map'));

		this.thead = thead;
		this.tbody = tbody;

		table.appendChild(thead);
		table.appendChild(tbody);

		buff.appendChild(table);
		WXJS.TOOL.$(this._getConfig('id') + '_GridBox').appendChild(buff);

		//设置标题如果有的话
		if(this._getConfig('title')){
			WXJS.TOOL.$(this._getConfig('id') + '_GridTitle').innerHTML = this._getConfig('title');
		}
	}

	/**
	 * 生成表格头：
	 * 1、对map循环
	 * 2、成员有name则渲染name，否则渲染index
	 */
	grid._generateThead = function(map){
		var buff = [], tmp;
		for(var i = 0; i < map.length; i++){
			tmp = (typeof map[i]['name'] == 'undefined') ? map[i]['index'] : map[i]['name'];
			buff.push(['<th>', tmp, '</th>'].join(''));
		}

		return ['<thead><tr>', buff.join(''), '</tr></thead>'].join('');
	}

	/**
	 * 生成表格数据：
	 * 1、对config.data循环
	 * 2、每一个成员做map循环
	 * 3、优先渲染renderer，其次渲染数据
	 */
	grid._generateData = function(data, map){
		var buff = [], tmp = '';
		var mapLength = map.length;
		for(var i = 0; i < data.length; i++){
			buff.push('<tr>');
			for(var j = 0; j < mapLength; j++){
				if(typeof data[i][map[j]['index']] != 'undefined'){
					if(typeof map[j]['renderer'] == 'function'){
						tmp = (map[j]['renderer'])(data[i][map[j]['index']]);
					}else{
						tmp = data[i][map[j]['index']];
					}
				}

				buff.push(['<td>', tmp, '</td>'].join(''))
			}
			buff.push('</tr>');
		}

		return buff.join('');
	}

	/**
	 * 设置配置
	 */
	grid._setConfig = function(key, value){
		this['config'][key] = value;
	}

	/**
	 * 读取配置
	 */
	grid._getConfig = function(key){
		return this['config'][key];
	}

	/**
	 * 表格获取数据
	 * @param condition object 查询对象
	 * @example
	 *  var condition = {
	 *		id: 1,
	 *		name: 'myname',
	 *		date: '2013-08-05'
	 *	}
	 *	myGrid.reload(condition);
	 */
	grid.reload = function(condition){
		var me = this;
		if(condition) this._setConfig('baseParams', condition);

		maskShow();

		WXJS.TOOL.ajax({
			type: 'POST',
			url: this._getConfig('ajaxUrl') + '?' + getBaseQueryStr(),
			dataType: 'json',
			data: getProQueryStr(),
			success: function(data){
		    	me._setConfig('data', data.result);
		    	me._setConfig('totalCount', parseInt(data.totalCount));
		    	me._load();
		    	me._renderPageInfo();

		    	maskHide();
			}
		});

		//生成表格ajax基本查询（起始、分页数量、排序列、排序升降）
		function getBaseQueryStr(){
			var baseBuff = ['start=', (me._getConfig('currentPage') - 1) * me._getConfig('pageSize') + 1, '&limit=', me._getConfig('pageSize')].join('');
			return baseBuff;
		}

		//生成表格的业务查询
		function getProQueryStr(){
			var proBuff = [],
				params = me._getConfig('baseParams');

			for(var key in params){
				proBuff.push([key, '=', params[key]].join(''));
			}

			return proBuff.join('&');
		}

		function maskShow(){
			WXJS.TOOL.jq('#' + me._getConfig('maskId')).show();
		}

		function maskHide(){
			WXJS.TOOL.jq('#' + me._getConfig('maskId')).hide();
		}
	}

	/**
	 * 渲染表格数据
	 */
	grid._load = function(){
		var buff = this._generateData(this._getConfig('data'), this._getConfig('map'));
		this.tbody.innerHTML = buff;
	}

	//分页相关api----------------------------------------------------------------------------

	/**
	 * 分页初始化:
	 * 1、拼接分页按钮的id
	 * 2、绑定分页按钮事件
	 *
	 * 备注：
	 * 在闭包中绑定为了保留this(grid)引用
	 */
	grid.pageInit = function(){
		var gridId = this._getConfig('id'),
			Previous = [gridId, '_Previous'].join('');
			Next = [gridId, '_Next'].join(''),
			GoPage = [gridId, '_GoPage'].join(''),
			SetPage = [gridId, '_SetPage'].join(''),

			me = this;

		WXJS.TOOL.bind(Previous, 'click', previous);
		WXJS.TOOL.bind(Next, 'click', next);
		WXJS.TOOL.bind(GoPage, 'click', goPage);

		function previous(){
			var currentPage = (me._getConfig('currentPage') == 1) ? 1 : me._getConfig('currentPage') - 1;
			me._setConfig('currentPage', currentPage);

			me.reload();
		}

		function next(){
			var totalPage = Math.ceil(me._getConfig('totalCount') / me._getConfig('pageSize'));
			var currentPage = (me._getConfig('currentPage') == totalPage) ? totalPage : me._getConfig('currentPage') + 1;
			me._setConfig('currentPage', currentPage);

			me.reload();
		}

		function goPage(){
			var page = WXJS.TOOL.jq('#' + SetPage).val();
			var currentPage = isNaN(parseInt(page)) ? me._getConfig('currentPage') : parseInt(page);
			me._setConfig('currentPage', currentPage);

			me.reload();
		}
	}

	/**
	 * 渲染分页信息
	 * 1、拼接分页按钮的id
	 * 2、计算各种数据并渲染页面
	 */
	grid._renderPageInfo = function(){
		var gridId = this._getConfig('id'),

			currentPage = [gridId, '_CurrentPage'].join(''),
			TotalPage = [gridId, '_TotalPage'].join(''),
			TotalCount = [gridId, '_TotalCount'].join(''),
			PageStart = [gridId, '_PageStart'].join(''),
			PageLimit = [gridId, '_PageLimit'].join(''),

			pageStart = (this._getConfig('currentPage') - 1) * this._getConfig('pageSize') + 1;
			totalPage = Math.ceil(this._getConfig('totalCount') / this._getConfig('pageSize'));

		WXJS.TOOL.$(currentPage).innerHTML = this._getConfig('currentPage');
		WXJS.TOOL.$(TotalPage).innerHTML = totalPage;
		WXJS.TOOL.$(TotalCount).innerHTML = this._getConfig('totalCount');
		WXJS.TOOL.$(PageStart).innerHTML = pageStart;

		//最后一页的判断逻辑
		WXJS.TOOL.$(PageLimit).innerHTML = (this._getConfig('currentPage') == totalPage) ? this._getConfig('totalCount') : pageStart + this._getConfig('pageSize') - 1;
	}

	return (grid.create = grid)
})()

/**
 * 微信工具方法（后续要分离逻辑）
 * 备注：
 * 需要做jquery解耦
 */
WXJS.TOOL = {
	$: function(dom){
		return document.getElementById(dom);
	},

	jq: $,

	ajax: function(opt){
		return $.ajax(opt);
	},

	bind: function(target, evt, func){
		return $('#' + target).bind(evt, func);
	}
}

/**
 *生成模版如下
 *<div id="<gridID>">
 *	<div id="<gridID>_GridBox" class="wxGridTop">
 *		<div id="<%gridID%>_GridTitle" class="wxGridTitle">表格标题</div>
 *		<div id="<gridID>_mask" class="loadMask">
 *			<div class="loadInfo">
 *				<img src="http://wx.itil.com/image/ajax-loader-3.gif">
 *				正在加载中，请稍后
 *			</div>
 *		</div>
 *	</div>
 *	<div id="<gridID>_PageBar" class="wxGridBottom">
 *		<span id="<gridID>_PageInfo">
 *			当前第 
 *			<span id="<gridID>_CurrentPage">1</span> 
 *			页(第 
 *			<span id="<gridID>_PageStart">1</span> 
 *			条到第 
 *			<span id="<gridID>_PageLimit">20</span> 
 *			条)，共 
 *			<span id="<gridID>_TotalPage">234</span> 
 *			页(总共
 *			<span id="<gridID>_TotalCount">10086</span> 
 *			条记录)
 *		</span>
 *		<span class="wxPager">
 *			<ul class="pager wxPagerNormalGroup">
 *				<li><a id="<gridID>_Previous" href="javascript:void(0)">上一页</a></li>
 *				<li><a id="<gridID>_Next" href="javascript:void(0)">下一页</a></li>
 *			</ul>
 *			<span class="goPager">
 *				<input id="<gridID>_SetPage" type="text" class="form-control wxPagerInput">
 *				<button id="<gridID>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button>
 *			</span>
 *		</span>
 *	</div>
 *</div>
 */