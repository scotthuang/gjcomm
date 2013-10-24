/**
 * WXJS.UI.GRID 微信itil展示型表格组件
 *
 * @version 2.0
 * @author scotthuang
 *
 * @desc 要注意：1、代码与jquery耦合，使用请注意在WXJS.TOOL中更改工具方法 2、css需要关联bootstrap
 * @update 相比1.0可以支持多表格
 */

// // TODO 
// style属性需要支持多规则，不应该仅仅支持width，需要改进 function: _generateThead

var WXJS = WXJS || {};
WXJS.UI = WXJS.UI || {};

/**
 * GRID 静态变量
 *
 * @namespace
 */
WXJS.UI.GRID = {
	/**
	 * 表格样式
	 * @type String
	 */
	//_commonStyle: 'table table-bordered table-striped table-hover', //git上的样式
	_commonStyle: 'table table-bordered table-striped table-hover table-condensed', //微信用的样式


	/**
	 * 排序字段子样式
	 * @type String
	 */
	_sortStyle: 'wxGridTheadSort',

	/**
	 * 排序字段样式(子样式的父标签)
	 * @type String
	 */
	_sortOperator: 'wxSort',

	/**
	 * 表头头中加入搜索后对排序样式调整
	 * @type {String}
	 */
	_wxSortTextStyle: 'wxSortText',

	/**
	 * 降序排序Icon
	 * @type String
	 */
	_sortUpIcon: 'glyphicon-chevron-up',

	/**
	 * 升序排序Icon
	 * @type String
	 */
	_sortDownIcon: 'glyphicon-chevron-down',

	/**
	 * 不可用样式
	 * @type String
	 */
	_disableStyle: 'disabled',

	/**
	 * 不可见样式
	 * @type String
	 */
	_displayNoneStyle: 'wxUnshown',

	/**
	 * 排序不可用样式
	 * @type String
	 */
	_displayDisable: 'wxSortDisable',

	/**
	 * 表格模版
	 * @type String
	 */
	//git用的模版
	//_tpl: '<div id="<%gridID%>_MainBox"><div id="<%gridID%>_GridBox" class="wxGridTop"><div id="<%gridID%>_GridTitle" class="wxGridTitle">表格标题</div><div id="<%gridID%>_mask" class="wxLoadMask"><div class="wxLoadInfo"><img src="http://wx.itil.com/image/ajax-loader-3.gif">正在加载中，请稍后</div></div></div><div id="<%gridID%>_PageBar" class="wxGridBottom"><span id="<%gridID%>_PageInfo">当前第 <span id="<%gridID%>_CurrentPage">0</span> 页(第 <span id="<%gridID%>_PageStart">1</span> 条到第 <span id="<%gridID%>_PageLimit">20</span> 条)，共 <span id="<%gridID%>_TotalPage">0</span> 页(总共<span id="<%gridID%>_TotalCount">10086</span> 条记录)</span><span class="wxPager"><ul class="pager wxPagerHack wxPagerNormalGroup"><li class="previous"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Previous" href="javascript:void(0)">上一页</a></li><li class="next"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Next" href="javascript:void(0)">下一页</a></li></ul><span class="goPager"><input id="<%gridID%>_SetPage" type="text" class="form-control wxPagerInput"><button id="<%gridID%>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button></span></span></div></div>',
	//微信用的模版
	_tpl: '<div id="<%gridID%>_MainBox"><div id="<%gridID%>_GridBox" class="wxGridTop"><div id="<%gridID%>_GridTitle" class="wxGridTitle wxUnshown">表格标题</div><div id="<%gridID%>_mask" class="wxLoadMask"><div class="wxLoadInfo"><img src="http://wx.itil.com/image/ajax-loader-3.gif"></div></div></div><div id="<%gridID%>_PageBar" class="wxGridBottom"><span class="wxPagerInfo" id="<%gridID%>_PageInfo">第 <span id="<%gridID%>_CurrentPage">0</span> / <span id="<%gridID%>_TotalPage">0</span> 页</span><span class="wxPager"><ul class="pager wxPagerHack wxPagerNormalGroup"><li class="previous"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Previous" href="javascript:void(0)">上一页</a></li><li class="next"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Next" href="javascript:void(0)">下一页</a></li></ul><span class="goPager"><input id="<%gridID%>_SetPage" type="text" class="form-control wxPagerInput"><button id="<%gridID%>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button></span></span></div></div>',

	/**
	 * 字段对齐
	 * @type object
	 */
	_align: {
		'left': 'text-align: left;',
		'center': 'text-align: center;',
		'right': 'text-align: right;',
	},

	/**
	 * 表格ajax字段配置
	 * @type String
	 */
	_config: {
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
	},

	/**
	 * 表格渲染前任务队列
	 * @type String
	 */
	_beforeQueue: [],

	/**
	 * 表格渲染后任务队列
	 * @type String
	 */
	_afterQueue: [],
                                 
	/**
	 * 设置表格全局配置
	 */
	setGlobalConfig: function(opt){
		this._config = opt;
	},

	/**
	 * 读取表格全局配置
	 * 
	 * @param {object} options
	 * @example
	 * WXJS.UI.GRID.setGlobalConfig({
	 *		//前端请求字段配置
	 *		sendParams: {
	 *			start: 'start', //开始点（可理解为页数 - 1）
	 *			limit: 'limit', //长度（pageSize）
	 *			dir: 'dir', //升序或降序 enum('desc', asc)
	 *			sort: 'sort' //排序字段
	 *		},
 	 *
	 *		//后台返回配置
	 *		receiveParams: {
	 *			total: 'totalCount', //总数
	 *			data: 'result' //结果集
	 *		}
	 *	});
	 */
	getGlobalConfig: function(){
		return this._config;
	},

	/**
	 * 创建GRID对象
	 *
	 * @param {object} options
	 * @return Object 返回 WXJS.UI.GRIDOBJECT
	 * @see WXJS.UI.GRIDOBJECT
	 */
	create: function(opt){
		return new WXJS.UI.GRIDOBJECT(opt);
	},

	/**
	 * 扩展GRID对象
	 *
	 * @param {object} options
	 * @desc 改变 GRIDOBJECT 中的方法来达到增加新特殊功能的目的
	 */
	extend: function(opt){
		for(var key in opt){
			WXJS.UI.GRIDOBJECT.prototype[key] = opt[key];
		}
	},

	/**
	 * 增加渲染前任务队列
	 *
	 * @param {object} options
	 * @desc 用途也是扩展表格功能
	 */
	addBefore: function(func){
		if(typeof func != 'function') return;

		WXJS.UI.GRID._beforeQueue.push(func);
	},

	/**
	 * 增加渲染后任务队列
	 *
	 * @param {object} options
	 * @desc 用途也是扩展表格功能
	 */
	addAfter: function(func){
		if(typeof func != 'function') return;

		WXJS.UI.GRID._afterQueue.push(func);
	}
}

/**
 * 创建GRID对象
 *
 * @param {object} options
 * @param {string} options.id 表格表示（全局唯一，是table的id）
 * @param {string} options.render 表格渲染对象（全局唯一）
 * @param {string} options.title 表格表格标题
 * @param {object} options.map 表格字段配置
 * @param {string} options.map.index 数据key
 * @param {string} options.map.name 数据渲染标题
 * @param {enum['left', 'center', 'right']} options.map.align 表格单元对齐
 * @param {function} options.map.renderer 数据渲染处理
 * @param {string} options.ajaxUrl 后台请求url
 * @param {int} options.pageSize 请求分页大小
 * @param {function} options.globalEvent 表格行点击事件
 * @example
 * //表格配置
 *	var opt = {
 *		//表格id(唯一、必填)
 *		id: 'testGrid',
 *		//表格渲染目标(唯一、必填)
 *		render: 'box',
 *		//表格标题
 *		title: '表格标题',
 *		//是否支持多选
 *		mutiSelect: true,
 *		//数据字段map
 *		map: [
 *			{'index': 'id', 'sort': true, 'event': {
 *				'click': function(e, data, me){
 *					alert('你正在点击列');
 *				}
 *			}},
 *			{'index': 'data', 'name': '数据', 'sort': true},
 *			{'index': 'id', 'name': '这是渲染列', renderer: function(val){
 *				return val + 'xxx';
 *			}},
 *			{'index': 'id', 'name': '操作', renderer: function(val){
 *				return '<span><a href="javascript:void(0)">查看详情</a></span>';
 *			}}
 *		],
 *		//后台cgi
 *		ajaxUrl: '/boot/cgi/data.php',
 *		//分页大小
 *		pageSize: 20,
 *
 *		//全局行绑定点击事件(e点击事件,data该行数据,me点击元素)
 *		globalEvent: function(e, data, me){
 *			//alert('你正在点击行');
 *		}
 *	}
 *
 *	var myGrid = WXJS.UI.GRID.create(opt);
 *	var myGrid = $('#box').fastUiGrid(opt);
 *
 * @return Object 返回 WXJS.UI.GRIDOBJECT
 * @constructor
 * @see WXJS.UI.GRID
 */
WXJS.UI.GRIDOBJECT = function(opt){
	var dom = null;

	//更改this引用
	var me = this;

	//是否直接加载数据
	var init = (typeof opt['init'] == 'boolean') ? opt['init'] : true;

	//渲染目标不存在则返回
	dom = (typeof opt['render'] == 'string') ? $('#' + opt['render']) : (typeof opt['render'] == 'object') ? opt['render'] : null;
	if(dom == null) return;

	me.config = {
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
		baseParams: {},

		//全局事件
		globalEvent: [],

		/**
		 * 表格ajax字段配置
		 * @type String
		 */
		ajaxConfig: {}
	}

	//表格渲染前运行
	me.beforeInit();

	//初始化配置项
	me.init(opt);

	//渲染主框架
	me.renderTpl(dom);

	//初始化表格
	me.gridInit();

	//初始化分页
	me.pageInit();

	//初始化数据
	!init || me.reload();
}

/**
 * 渲染表格框架
 */
WXJS.UI.GRIDOBJECT.prototype.renderTpl = function($dom){
	$dom.html(WXJS.UI.GRID._tpl.replace(/<%gridID%>/g, this._getConfig('id')));
}

/**
 * 表格配置项
 */
WXJS.UI.GRIDOBJECT.prototype.init = function(opt){
	var me = this;

	//是否要去增加mutiSelect框
	!opt.mutiSelect || mutiSelectInit();

	//必选配置
	this._setConfig('id', opt.id);
	this._setConfig('map', opt.map);
	this._setConfig('ajaxUrl', opt.ajaxUrl);
	this._setConfig('pageSize', opt.pageSize);
	this._setConfig('title', opt.title);

	//事件绑定
	this._getConfig('globalEvent').push(opt.globalEvent);

	//设置遮罩id
	this._setConfig('maskId', [opt.id, '_mask'].join(''));

	//可选配置
	opt.ajaxConfig ? this._setConfig('ajaxConfig', opt.ajaxConfig) : this._setConfig('ajaxConfig', WXJS.UI.GRID.getGlobalConfig());

	//多选框配置
	function mutiSelectInit(){
		opt.map.unshift({
			'index': 'checkbox', 
			'name': '<div style="text-align:center;"><input type="checkbox" id="' + opt.id + '_MutiSelect"/><div>', 
			'ignore': true, 
			'align': 'center', 
			'style': 'width: 55px;', 
			'renderer': function(val, row){
				return ['<input ', 'class="', opt.id, '_SelectBox', '"', ' type="checkbox" ', (row._select ? 'checked' : ''), '/>'].join('');
			},
			'event': {
				//本列中不触发点击行事件
				'click': function(e, data, me){
					return false;
				}
			}
		})

		//设置行事件要提供方法（需重构）
		me._getConfig('globalEvent').push(function(e, data, tr){
			var index = $(tr).index(),
				tmpData = me._getConfig('data'),
				checked = $(tr).find('.' + opt.id + '_SelectBox')[0].checked;

			tmpData[index]['_select'] = !checked;
			me._setConfig('data', tmpData);

			$(tr).find('.' + opt.id + '_SelectBox')[0].checked = !checked; //太sb了
		});

		WXJS.UI.GRID.addAfter(function(){
			$('#' + opt.id + '_MutiSelect').bind('click', function(){
				var checked = this.checked,
					tmpData = me._getConfig('data');

				$('.' + opt.id + '_SelectBox').each(function(e){
					var $tr = $(this).parent().parent();
					if($tr.css('display') == 'none') return true;

					this.checked = checked;
					tmpData[e]['_select'] = checked;
				})
			});

			$('.' + opt.id + '_SelectBox').bind('click', function(){
				var eq = $(this).parent().parent().index(),
					tmpData = me._getConfig('data');

				tmpData[eq]['_select'] = this.checked;
				me._setConfig('data', tmpData);
			})
		})

		WXJS.UI.GRID.extend({
			'getSelectColumns': function(){
				var cols = [];
				$('.' + opt.id + '_SelectBox').each(function(num){
					!this.checked || cols.push(me._getRowData(num));
				})

				return cols;
			}
		})
	}
}

/**
 * 初始化：
 * 1、生成表格框架(table thead tbody)
 * 2、填thead数据
 * 3、渲染表格入dom
 * 4、表格头加排序事件
 */
WXJS.UI.GRIDOBJECT.prototype.gridInit = function(){
	var me  = this,

		$buff = $('<table></table>'),
		$thead = $('<thead></thead>'),
		$tbody = $('<tbody><tr><td colspan="200">没有记录</td></tr></tbody>'), //默认插一条空记录

		theadId = [me._getConfig('id'), '_GridThead'].join(''),
		tbodyId = [me._getConfig('id'), '_GridTbody'].join('');

	$buff.attr('id', me._getConfig('id')).addClass(WXJS.UI.GRID._commonStyle);
	$tbody.attr('id', tbodyId);

	$thead.html(me._generateThead(me._getConfig('map')));

	$buff.append($thead).append($tbody);
	$('#' + me._getConfig('id') + '_GridBox').append($buff);

	//设置标题如果有的话
	!this._getConfig('title') || $('#' + me._getConfig('id') + '_GridTitle').html(me._getConfig('title'));

	//设置容器固定高度
	if(this._getConfig('height')){
		$('#' + this._getConfig('id')).parent().css('height', this._getConfig('height') + 'px');
		$('#' + this._getConfig('id')).parent().css('overflow-y', auto);
	}

	//如果pageSize为0则代表不分页，分页栏取消，同时设置所有排序为本体排序
	if(!this._getConfig('pageSize')){
		$('#' + this._getConfig('id') + '_PageBar').hide();
		me._setConfig('sortType', 'local');
	}

	$('#' + theadId + ' .' + WXJS.UI.GRID._sortStyle).bind('click', theadSort); //对th加事件

	//绑定排序事件
	function theadSort(){
		/* ---------------------------------- 以下这段是用来设置搜索状态（即样式变化），和搜索逻辑无关 ------------------- */
		var sortStatus = this.getAttribute('data-sort'),
			newStatus = '',
			newStyle = '';

		//页数置为1
		me._setConfig('currentPage', 1);

		$('#' + theadId + ' span').each(function(){
			$(this).hasClass(WXJS.UI.GRID._displayDisable) || $(this).addClass(WXJS.UI.GRID._displayDisable)
			this.setAttribute('data-sort', '');
		})

		newStatus = (sortStatus == null || sortStatus == '') ? 'desc' : (sortStatus == 'desc') ? 'asc' : 'desc';
		newStyle = (newStatus == 'desc') ? WXJS.UI.GRID._sortDownIcon : WXJS.UI.GRID._sortUpIcon;

		this.setAttribute('data-sort', newStatus);

		$(this).find('.' + newStyle).removeClass(WXJS.UI.GRID._displayDisable);
		/* ----------------------------------------------------- 结束 ----------------------------------------------------- */

		//判断是本地搜索还是远程搜索
		if(me._getConfig('sortType') == 'local'){
			var map = me._getConfig('map'),
				index = this.getAttribute('data-index');
				sortFunc = null,
				tmpData = me._getConfig('data');

			for(var i = 0; i < map.length; i++){
				//自动补一个event成员（要重构，不应该在这里补，而在init补）
				map[i]['event'] = map[i]['event'] || {};
				if(map[i]['index'] == index){
					sortFunc = (map[i]['event']['sort']) ? map[i]['event']['sort'] : function(m, n){
						//默认排序方法（就普通return）
						return m[index] < n[index];
					};
					break;
				}
			}

			tmpData.sort(sortFunc);

			me._setConfig('data', (newStatus == 'desc') ? tmpData : tmpData.reverse());
			me._load()
		}else{
			//设置配置发请求
			me._setConfig('sort', this.parentNode.getAttribute('data-index'));
			me._setConfig('dir', newStatus);
			
			me.reload();
		}
	}
}

/**
 * 生成表格头：
 * 1、对map循环
 * 2、成员有name则渲染name，否则渲染index
 */
WXJS.UI.GRIDOBJECT.prototype._generateThead = function(map){
	var buff = [], 
		tmp, 
		sortStyle = '',
		widthStyle = '', 
		sortSpecStyle = '',
		style;

	for(var i = 0; i < map.length; i++){
		tmp = map[i]['name'] || map[i]['index'];

		//搜索框
		!map[i]['search'] || (
			tmp = [
				'<input data-index="', 
				map[i]['index'], 
				'" type="text" class="form-control ', this._getConfig('id'), '_SearchInput', '" style="display: inline-block; width: 75%;" placeholder="', 
				tmp, 
				'"/>'
			].join('')
		)

		!map[i]['search'] || (sortSpecStyle = WXJS.UI.GRID._wxSortTextStyle);
		!map[i]['sort'] || (sortStyle = WXJS.UI.GRID._sortStyle);
		//style属性需要支持多规则，不应该仅仅支持width，需要改进
		!map[i]['width'] || (widthStyle = [parseInt(map[i]['width']), 'px'].join(''));

		buff.push(
			[
				'<th class="wxThead ', sortStyle, ' ', sortSpecStyle,
				'" style="width: ', widthStyle, 
				'" data-index="', map[i]['index'], 
				'">'
			].join('')
		);

		buff.push(tmp);

		if(sortStyle) 
			buff.push(['<div class="wxSort"><span class="glyphicon ', WXJS.UI.GRID._sortUpIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span><span class="glyphicon ', WXJS.UI.GRID._sortDownIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span></div>'].join(''));

		buff.push('</th>');
	}

	return ['<tr id="', this._getConfig('id') ,'_GridThead">', buff.join(''), '</tr>'].join('');
}

/**
 * 生成表格数据：
 * 1、对config.data循环
 * 2、每一个成员做map循环
 * 3、优先渲染renderer，其次渲染数据
 */
WXJS.UI.GRIDOBJECT.prototype._generateData = function(data, map){
	var buff = [], tmp = '',
		mapLength = map.length,
		style,
		align,
		renderType, //渲染类型 对象 or 数组
		raw; //真实数据
	
	//没有记录时插空记录
	if(data.length == 0){
		buff.push([
			'<tr><td colspan="200">没有记录</td></tr>'
		]);
	}

	for(var i = 0; i < data.length; i++){
		renderType = data[i] instanceof Array;

		buff.push([
			'<tr',
			' class="', this._getConfig('id'), '_GridTr"',
			' style="display: ', (data[i]['_filter'] ? 'none' : ''), '"',
			'>'
		].join(''));

		for(var j = 0; j < mapLength; j++){
			raw = renderType ? data[i][j] : data[i][map[j]['index']];

			if((raw || renderType) && !map[j]['ignore']){ //ignore的作用是忽略数据渲染，例如多选框
				if(typeof map[j]['renderer'] == 'function'){
					/*
					 * function(val, row){
					 *     console.log(val);
					 *     console.log(row.id);
					 * }
					 */
					tmp = (map[j]['renderer'])(raw, data[i]);
				}else{
					tmp = raw;
				}
			}

			style = map[j]['style'] || '';
			align = WXJS.UI.GRID._align[map[j]['align']] || '';

			buff.push([
				'<td',
				' style="', style, align, '"',
				' class="', this._getConfig('id'), '_GridTd_', j, '"', 
				' data-index="', map[j]['index'], '">', 
				tmp, 
				'</td>'
			].join(''))
		}
		buff.push('</tr>');
	}

	return buff.join('');
}

/**
 * 设置配置
 */
WXJS.UI.GRIDOBJECT.prototype._setConfig = function(key, value){
	this['config'][key] = value;
}

/**
 * 读取配置
 */
WXJS.UI.GRIDOBJECT.prototype._getConfig = function(key){
	return this['config'][key];
}

/**
 * 按索引读原生数据(私有api 非拓展表格功能请勿使用)
 * @example:
 *  	config: { data: ['a', 'b', 'c']}
 *		grid._getRowData(0); //a
 */
WXJS.UI.GRIDOBJECT.prototype._getRowData = function(index){
	return this._getConfig('data')[index];
}

/**
 * 表格获取数据
 * @param condition object 查询对象
 * @param flag bool 是否初始化(页数置为1 排序字段取消)
 * @example
 *  var condition = {
 *		'get': {
 *			a: 'b'
 *		},
 *
 *		'post': {
 *			c: 'd'
 *		}
 *	}
 *	myGrid.reload(condition, true);
 */
WXJS.UI.GRIDOBJECT.prototype.reload = function(condition, flag){
	var me = this,
		gridId = me._getConfig('id'),
		Previous = [gridId, '_Previous'].join(''),
		Next = [gridId, '_Next'].join('');

	//是否设置业务查询
	!condition || this._setConfig('baseParams', condition);

	//遮罩打开
	maskShow();

	//是否初始化请求
	!flag || ajaxInit();

	$.ajax({
		type: 'POST',
		url: [
			this._getConfig('ajaxUrl'),
			this._getConfig('ajaxUrl').indexOf('?') < 0 ? '?' : '&',
			this.getBaseQueryStr(),
			'&',
			parseCondition()['get']
		].join(''),
		
		dataType: 'json',
		data: this.getProQueryStr() + '&' + parseCondition()['post'],
		success: function(data){
			me._setConfig('data', getReceiveData(data, me._getConfig('ajaxConfig')['receiveParams']['data']));

			//如果不分页则不需设置totalCount字段
    		!me._getConfig('pageSize') || me._setConfig('totalCount', parseInt(getReceiveData(data, me._getConfig('ajaxConfig')['receiveParams']['total'])));
	    	
	    	me._load();
	    	me._renderPageInfo();

	    	_setBtnDisable();
	    	maskHide();
		}
	});

	//解析自定义搜索项(get or post)
	function parseCondition(){
		var search = {
			get: '',
			post: ''
		}, con = me._getConfig('baseParams');
		for(var key in con){
			if(key.toLowerCase() == 'get'){
				search.get = params2str(con[key]);
			}

			if(key.toLowerCase() == 'post'){
				search.post = params2str(con[key]);
			}
		}

		return search;

		function params2str(params){
			var proBuff = [];
			for(var key in params){
				proBuff.push([key, '=', params[key]].join(''));
			}

			return proBuff.join('&');
		}
	}

	/* 
	 * 支持多级字段: {'data': {'result': {'aadata': {}}} key: 'data.result.aadata'
	 * 支持直接返回数组 [1, 2, 3] key = ''
	 */ 
	function getReceiveData(rawData, key){
		if(key == ''){
			return rawData;
		}

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
			$('#' + Previous).parent().addClass(WXJS.UI.GRID._disableStyle);
		}else{
			$('#' + Previous).parent().removeClass(WXJS.UI.GRID._disableStyle);
		}
		if(me._getConfig('currentPage') == totalPage || 0 == totalPage){
			$('#' + Next).parent().addClass(WXJS.UI.GRID._disableStyle);
		}else{
			$('#' + Next).parent().removeClass(WXJS.UI.GRID._disableStyle);
		}
	}

	//初始化页数、排序
	function ajaxInit(){
		me._setConfig('currentPage', 1);
		me._setConfig('sort', '');
		me._setConfig('dir', '');
	}

	function maskShow(){
		$('#' + me._getConfig('maskId')).show();
	}

	function maskHide(){
		$('#' + me._getConfig('maskId')).hide();
	}
}

/**
 * 渲染表格数据
 */
WXJS.UI.GRIDOBJECT.prototype._load = function(){
	var buff = this._generateData(this._getConfig('data'), this._getConfig('map'));
	
	$('#' + this._getConfig('id') + '_GridTbody').html(buff);
	
	//表格渲染结束运行
	this._bind();
	this.afterInit();
}

/**
 *生成表格ajax基本查询（起始、分页数量、排序列、排序升降）
 */
WXJS.UI.GRIDOBJECT.prototype.getBaseQueryStr = function(){
	var baseBuff = [
		this._getConfig('ajaxConfig')['sendParams']['start'], '=', (this._getConfig('currentPage') - 1) * this._getConfig('pageSize'), 
		'&', 
		this._getConfig('ajaxConfig')['sendParams']['limit'] , '=', this._getConfig('pageSize'),
		'&',
		this._getConfig('ajaxConfig')['sendParams']['sort'], '=', this._getConfig('sort'),
		'&',
		this._getConfig('ajaxConfig')['sendParams']['dir'], '=', this._getConfig('dir')
	].join('');
	
	return baseBuff;
}

/**
 * 生成表格的业务查询
 * 这个方法改成post自定义拼装方法，用于一些需要post很复杂的数据，如datatable中的aodata
 * 新方法中默认返回空，如需要自定义则用gird.extend('getProQueryStr': func)
 */
WXJS.UI.GRIDOBJECT.prototype.getProQueryStr = function(){
	return '';
}

/**
 * 绑定表格事件
 */
WXJS.UI.GRIDOBJECT.prototype._bind = function(){
	var girdId = this._getConfig('id'),
		me = this
		globalEvents = this._getConfig('globalEvent'),
		cursorFlag = false;

	//绑定全局行点击事件
	for(var i = 0; i < globalEvents.length; i++){
		if(typeof globalEvents[i] != 'function') continue;

		//再封装一层闭包传入i防止闭包传入引用
		(function(index, globalEvents){
			$(['.', girdId, '_GridTr'].join('')).bind('click', (function(e){
				packageEvent(e, this, globalEvents[index]);
			}));
		})(i, globalEvents)
		
		cursorFlag || $('#' + girdId + ' tbody').css('cursor', 'pointer');
		cursorFlag = true;
	}

	//绑定列事件
	for(var i = 0; i < this._getConfig('map').length; i++){
		if(typeof this._getConfig('map')[i]['event'] == 'object'){
			for(var j in this._getConfig('map')[i]['event']){
				if(j == 'sort') continue;
				
				//再封装一层闭包传入i, j防止闭包传入引用
				(function(i, j, me){
					$(['.', girdId, '_GridTd_', i].join('')).bind(j, (function(e){
						packageEvent(e, this, me._getConfig('map')[i]['event'][j])
					}));
				})(i, j, me)

				//阻止事件传递
				$(['.', girdId, '_GridTd_', i].join('')).bind(j, function(e){
					e.stopPropagation();
				})
				//加手型
				.css('cursor', 'pointer');
			}
		}
	}

	//恶心的逻辑获取事件列的父tr，计算相对位置并返回原生数据（要重构）
	function packageEvent(e, obj, func){
		var nodeName = obj.nodeName.toLowerCase(),
			index = (nodeName == 'td' ? $(obj).parent().index() : $(obj).index()),

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
WXJS.UI.GRIDOBJECT.prototype.pageInit = function(){
	var gridId = this._getConfig('id'),
		Previous = [gridId, '_Previous'].join('');
		Next = [gridId, '_Next'].join(''),
		GoPage = [gridId, '_GoPage'].join(''),

		me = this;

	//用闭包传入不同的this引用
	(function(me){
		$('#' + Previous).click(function(){
			previous(me, this);
		});
		$('#' + Next).click(function(){
			next(me, this);
		});
		$('#' + GoPage).click(function(){
			goPage(me);
		});
	})(me)
	
	function previous(me, obj){
		if(!_checkDisable(obj)) return;

		var currentPage = (me._getConfig('currentPage') == 1) ? 1 : me._getConfig('currentPage') - 1;
		me._setConfig('currentPage', currentPage);

		me.reload();
	}

	function next(me, obj){
		if(!_checkDisable(obj)) return;

		var totalPage = Math.ceil(me._getConfig('totalCount') / me._getConfig('pageSize')), 
			currentPage = (me._getConfig('currentPage') == totalPage) ? totalPage : me._getConfig('currentPage') + 1;

		me._setConfig('currentPage', currentPage);

		me.reload();
	}

	function _checkDisable(obj){
		return !$(obj).parent().hasClass(WXJS.UI.GRID._disableStyle)
	}

	function goPage(me){
		var totalPage = Math.ceil(me._getConfig('totalCount') / me._getConfig('pageSize')),
			page = $('#' + me._getConfig('id') + '_SetPage').val(),
			currentPage = parseInt(page);

		if(currentPage < 1 || currentPage > totalPage || isNaN(currentPage)){
			return;
		}

		me._setConfig('currentPage', currentPage);

		me.reload();
	}
}

/**
 * 渲染分页信息
 * 1、拼接分页按钮的id
 * 2、计算各种数据并渲染页面
 */
WXJS.UI.GRIDOBJECT.prototype._renderPageInfo = function(){
	var gridId = this._getConfig('id'),

		currentPage = [gridId, '_CurrentPage'].join(''),
		TotalPage = [gridId, '_TotalPage'].join(''),
		TotalCount = [gridId, '_TotalCount'].join(''),
		PageStart = [gridId, '_PageStart'].join(''),
		PageLimit = [gridId, '_PageLimit'].join(''),

		pageStart = (this._getConfig('currentPage') - 1) * this._getConfig('pageSize') + 1;
		totalPage = Math.ceil(this._getConfig('totalCount') / this._getConfig('pageSize'));

	$('#' + currentPage).html(this._getConfig('currentPage'));
	$('#' + TotalPage).html(totalPage);
	$('#' + TotalCount).html(this._getConfig('totalCount'));
	$('#' + PageStart).html(pageStart);

	//最后一页的判断逻辑
	$('#' + PageLimit).html((this._getConfig('currentPage') == totalPage) ? this._getConfig('totalCount') : pageStart + this._getConfig('pageSize') - 1);
}

//表格扩展相关api----------------------------------------------------------------------------

/**
 * 设置扩展接口
 */
WXJS.UI.GRIDOBJECT.prototype.extend = function(opt){
	for(var key in opt){
		this[key] = opt[key];
	}
}

WXJS.UI.GRIDOBJECT.prototype.beforeInit = function(){
	for(var i = 0; i < WXJS.UI.GRID._beforeQueue.length; i++){
		WXJS.UI.GRID._beforeQueue[i](this);
	}
}

WXJS.UI.GRIDOBJECT.prototype.afterInit = function(){
	for(var i = 0; i < WXJS.UI.GRID._afterQueue.length; i++){
		WXJS.UI.GRID._afterQueue[i](this);
	}
}

WXJS.UI.GRIDOBJECT.prototype.filter = function(str, arr){
	var $tr = $('.' + me._getConfig('id') + '_GridTr'),
		tmpData = me._getConfig('data');

	//清除过滤
	if(str == ''){
		$tr.show();
		for(var i = 0; i < tmpData.length; i++){
			tmpData[i]['_filter'] = false;
		}
		return;
	}

	$tr.each(function(e){
		var $td = $(this).children(),
			flag = true;
		
		$td.each(function(){
			if((typeof arr == 'string' && $(this).attr('data-index') == arr) || (typeof arr == 'object' && $.inArray($(this).attr('data-index'), arr))){
				if($(this).text().indexOf(str) >= 0){
					flag = false;
					return true;
				}
			}
		});

		!flag || $(this).hide();
		tmpData[e]['_filter'] = flag;
	})

	me._setConfig('data', tmpData);
}

/**
 * 封装jQuery接口
 */
!function($){
	$.fn.fastUiGrid = function(opt){
		opt.render = $(this);

		return WXJS.UI.GRID.create(opt);
	}

	$.fastUiGridApi = WXJS.UI.GRID;

}(jQuery)