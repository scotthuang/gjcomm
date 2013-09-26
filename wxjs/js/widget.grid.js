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
	var _commonStyle = 'table table-bordered table-striped table-hover',
		_sortStyle = 'wxGridTheadSort',
		_disableStyle = "disabled",
		_displayNoneStyle = "wxUnshown",
		_tpl = '<div id="<%gridID%>_MainBox"><div id="<%gridID%>_GridBox" class="wxGridTop"><div id="<%gridID%>_GridTitle" class="wxGridTitle">表格标题</div><div id="<%gridID%>_mask" class="wxLoadMask"><div class="wxLoadInfo"><img src="http://wx.itil.com/image/ajax-loader-3.gif">正在加载中，请稍后</div></div></div><div id="<%gridID%>_PageBar" class="wxGridBottom"><span id="<%gridID%>_PageInfo">当前第 <span id="<%gridID%>_CurrentPage">1</span> 页(第 <span id="<%gridID%>_PageStart">1</span> 条到第 <span id="<%gridID%>_PageLimit">20</span> 条)，共 <span id="<%gridID%>_TotalPage">234</span> 页(总共<span id="<%gridID%>_TotalCount">10086</span> 条记录)</span><span class="wxPager"><ul class="pager wxPagerHack wxPagerNormalGroup"><li class="previous"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Previous" href="javascript:void(0)">上一页</a></li><li class="next"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Next" href="javascript:void(0)">下一页</a></li></ul><span class="goPager"><input id="<%gridID%>_SetPage" type="text" class="form-control wxPagerInput"><button id="<%gridID%>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button></span></span></div></div>',
		//默认请求参数字段
		_config = {
			sendParams: {
				start: 'start',
				limit: 'limit',
				dir: 'dir',
				sort: 'sort'
			},

			receiveParams: {
				total: 'totalCount',
				data: 'result'
			}
		};

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

		sort: '',
		dir: '',

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

		//事件绑定
		this._setConfig('globalEvent', opt.globalEvent);

		//设置遮罩id
		this._setConfig('maskId', [opt.id, '_mask'].join(''));
	}

	/**
	 * 初始化：
	 * 1、生成表格框架(table thead tbody)
	 * 2、填thead数据
	 * 3、渲染表格入dom
	 * 4、表格头加排序事件
	 * 备注
	 * 这里要封装js底层方法
	 */
	grid.gridInit = function(){
		var me  = this;
		//-------------------------------------------下面要重构---------------------------------------
		var buff = document.createDocumentFragment();
		var table = document.createElement('table');
		var thead = document.createElement('thead');
		var tbody = document.createElement('tbody');

		var theadId = [this._getConfig('id'), '_GridThead'].join('');

		table.id = this._getConfig('id');
		table.className = _commonStyle;
		thead.innerHTML = this._generateThead(this._getConfig('map'));

		this.thead = thead;
		this.tbody = tbody;

		table.appendChild(thead);
		table.appendChild(tbody);

		buff.appendChild(table);
		WXJS.TOOL.$(this._getConfig('id') + '_GridBox').appendChild(buff);
		//-------------------------------------------重构 end---------------------------------------

		//设置标题如果有的话
		if(this._getConfig('title')){
			WXJS.TOOL.$(this._getConfig('id') + '_GridTitle').innerHTML = this._getConfig('title');
		}

		WXJS.TOOL.jq('#' + theadId + ' .' + _sortStyle).bind('click', theadSort);

		//绑定排序事件
		function theadSort(){
			var sortStatus = this.lastElementChild.getAttribute('data-sort'),
				newStatus = '',
				newStyle = '';

			//页数置为1
			me._setConfig('currentPage', 1);

			WXJS.TOOL.jq('#' + theadId + ' span').each(function(){
				!WXJS.TOOL.jq(this).hasClass(_displayNoneStyle) || WXJS.TOOL.jq(this).addClass(_displayNoneStyle);
				!WXJS.TOOL.jq(this).hasClass('glyphicon-arrow-up') || WXJS.TOOL.jq(this).removeClass('glyphicon-arrow-up');
				!WXJS.TOOL.jq(this).hasClass('glyphicon-arrow-down') || WXJS.TOOL.jq(this).removeClass('glyphicon-arrow-down');
				this.setAttribute('data-sort', '');
			})

			newStatus = (sortStatus == null || sortStatus == '') ? 'desc' : (sortStatus == 'desc') ? 'asc' : 'desc';
			newStyle = (newStatus == 'desc') ? 'glyphicon-arrow-down' : 'glyphicon-arrow-up';
			this.lastElementChild.setAttribute('data-sort', newStatus);

			WXJS.TOOL.jq(this).find('span').removeClass(_displayNoneStyle);
			WXJS.TOOL.jq(this).find('span').addClass(newStyle);

			//设置配置发请求
			me._setConfig('sort', this.getAttribute('data-index'));
			me._setConfig('dir', newStatus);

			me.reload();
		}
	}

	/**
	 * 生成表格头：
	 * 1、对map循环
	 * 2、成员有name则渲染name，否则渲染index
	 */
	grid._generateThead = function(map){
		var buff = [], tmp, sortStyle;
		for(var i = 0; i < map.length; i++){
			tmp = (typeof map[i]['name'] == 'undefined') ? map[i]['index'] : map[i]['name'];
			sortStyle = (typeof map[i]['sort'] == 'undefined') ? '' : _sortStyle;
			buff.push([
				'<th class="wxThead ', sortStyle, '" data-index="', map[i]['index'], '">', 
				tmp, 
				'<span class="glyphicon ', _displayNoneStyle, '"></span>',
				'</th>'
			].join(''));
		}

		return ['<thead><tr id="', this._getConfig('id') ,'_GridThead">', buff.join(''), '</tr></thead>'].join('');
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
			buff.push(['<tr class="', this._getConfig('id'), '_GridTr">'].join(''));
			for(var j = 0; j < mapLength; j++){
				if(typeof data[i][map[j]['index']] != 'undefined'){
					if(typeof map[j]['renderer'] == 'function'){
						tmp = (map[j]['renderer'])(data[i][map[j]['index']]);
					}else{
						tmp = data[i][map[j]['index']];
					}
				}

				buff.push(['<td class="', this._getConfig('id'), '_GridTd_', j, '">', tmp, '</td>'].join(''))
			}
			buff.push('</tr>');
		}

		return buff.join('');
	}


	/**
	 * 设置表格全局配置
	 */
	grid.setGlobalConfig = function(opt){
		_config = opt;
	}

	/**
	 * 读取表格全局配置
	 */
	grid.getGlobalConfig = function(baseKey, key){
		return _config[baseKey][key];
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
	 * 读取原生数据
	 */
	grid._getRowData = function(index){
		return this._getConfig('data')[index];
	}

	/**
	 * 设置扩展接口
	 */
	grid.extend = function(opt){
		for(var key in opt){
			this[key] = opt[key];
		}
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
		var me = this,
			gridId = me._getConfig('id'),
			Previous = [gridId, '_Previous'].join(''),
			Next = [gridId, '_Next'].join('');

		//是否设置业务查询
		!condition || this._setConfig('baseParams', condition);

		//遮罩打开
		maskShow();

		WXJS.TOOL.ajax({
			type: 'POST',
			url: this._getConfig('ajaxUrl') + '&' + this.getBaseQueryStr(),
			dataType: 'json',
			data: this.getProQueryStr(),
			success: function(data){
		    	me._setConfig('data', getReceiveData(data, me.getGlobalConfig('receiveParams', 'data')));
		    	me._setConfig('totalCount', parseInt(getReceiveData(data, me.getGlobalConfig('receiveParams', 'total'))));
		    	me._load();
		    	me._renderPageInfo();
		    	me._bind();

		    	_setBtnDisable();
		    	maskHide();
			}
		});

		//支持多级字段: {'data': {'result': {'aadata': {}}} key: 'data.result.aadata'
		function getReceiveData(rawData, key){
			if(key.indexOf('.') < 0){
				return rawData[key];
			}

			var tmp = key.split('.'),
				i,
				data = rawData;

			for(i = 0; i < tmp.length; i++){
				data = data[tmp[i]];
			}
			return data;
		}

		//读取后设置上下页状态
		function _setBtnDisable(){
			if(me._getConfig('currentPage') == 1){
				WXJS.TOOL.jq('#' + Previous).parent().addClass(_disableStyle);
			}else{
				WXJS.TOOL.jq('#' + Previous).parent().removeClass(_disableStyle);
			}
			if(me._getConfig('currentPage') == totalPage){
				WXJS.TOOL.jq('#' + Next).parent().addClass(_disableStyle);
			}else{
				WXJS.TOOL.jq('#' + Next).parent().removeClass(_disableStyle);
			}
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

	/**
	 *生成表格ajax基本查询（起始、分页数量、排序列、排序升降）
	 */
	grid.getBaseQueryStr = function(){
		var baseBuff = [
			this.getGlobalConfig('sendParams', 'start'), '=', (this._getConfig('currentPage') - 1) * this._getConfig('pageSize'), 
			'&', 
			this.getGlobalConfig('sendParams', 'limit') , '=', this._getConfig('pageSize'),
			'&',
			this.getGlobalConfig('sendParams', 'sort'), '=', this._getConfig('sort'),
			'&',
			this.getGlobalConfig('sendParams', 'dir'), '=', this._getConfig('dir')
		].join('');
		return baseBuff;
	}

	/**
	 *生成表格的业务查询
	 */
	grid.getProQueryStr = function(){
		var proBuff = [],
			params = this._getConfig('baseParams');

		for(var key in params){
			proBuff.push([key, '=', params[key]].join(''));
		}

		return proBuff.join('&');
	}

	/**
	 * 绑定表格事件
	 */
	grid._bind = function(){
		var girdId = this._getConfig('id'),
			me = this;

		//绑定全局行点击事件
		if(typeof this._getConfig('globalEvent') == 'function'){
			WXJS.TOOL.jq(['.', girdId, '_GridTr'].join('')).bind('click', (function(e){
				packageEvent(e, this, me._getConfig('globalEvent'));
			}));

			//变手型
			WXJS.TOOL.jq('#' + girdId + ' tbody').css('cursor', 'pointer');
		}

		//绑定列事件
		for(var i = 0; i < this._getConfig('map').length; i++){
			if(typeof this._getConfig('map')[i]['event'] == 'object'){
				for(var j in this._getConfig('map')[i]['event']){
					//再封装一层闭包传入i, j防止闭包传入引用
					WXJS.TOOL.jq(['.', girdId, '_GridTd_', i].join('')).bind(j, (function(i, j){
						return (function(e){
							packageEvent(e, this, me._getConfig('map')[i]['event'][j])
						})
					})(i, j));

					//阻止事件传递
					WXJS.TOOL.jq(['.', girdId, '_GridTd_', i].join('')).bind(j, function(e){
						e.stopPropagation();
					})
					//加手型
					.css('cursor', 'pointer');
				}
			}
		}

		//恶心的逻辑获取事件列的父tr，计算位置并返回原生数据（要重构）
		function packageEvent(e, obj, func){
			var index = WXJS.TOOL.jq(obj).parent().index(),
				rowData = me._getRowData(index);

			func(e, rowData, obj);
		}
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

			//只计算一次，避免浪费计算
			totalPage = Math.ceil(this._getConfig('totalCount') / this._getConfig('pageSize')),

			me = this;

		WXJS.TOOL.bind(Previous, 'click', previous);
		WXJS.TOOL.bind(Next, 'click', next);
		WXJS.TOOL.bind(GoPage, 'click', goPage);

		function previous(){
			if(!_checkDisable(this)) return;

			var currentPage = (me._getConfig('currentPage') == 1) ? 1 : me._getConfig('currentPage') - 1;
			me._setConfig('currentPage', currentPage);

			me.reload();
		}

		function next(){
			if(!_checkDisable(this)) return;

			var currentPage = (me._getConfig('currentPage') == totalPage) ? totalPage : me._getConfig('currentPage') + 1;
			me._setConfig('currentPage', currentPage);

			me.reload();
		}

		function _checkDisable(obj){
			return !WXJS.TOOL.jq(obj).parent().hasClass(_disableStyle)
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