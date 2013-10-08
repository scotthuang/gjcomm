/**
 * WXJS.UI.GRID 微信itil展示型表格组件
 *
 * @version 2.0
 * @author scotthuang
 *
 * @desc 要注意：1、代码与jquery耦合，使用请注意在WXJS.TOOL中更改工具方法 2、css需要关联bootstrap
 * @update 相比1.0可以支持多表格
 */

// // TODO TOOL类中方法解耦

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
	_commonStyle: 'table table-bordered table-striped table-hover',

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
	_tpl: '<div id="<%gridID%>_MainBox"><div id="<%gridID%>_GridBox" class="wxGridTop"><div id="<%gridID%>_GridTitle" class="wxGridTitle">表格标题</div><div id="<%gridID%>_mask" class="wxLoadMask"><div class="wxLoadInfo"><img src="http://wx.itil.com/image/ajax-loader-3.gif">正在加载中，请稍后</div></div></div><div id="<%gridID%>_PageBar" class="wxGridBottom"><span id="<%gridID%>_PageInfo">当前第 <span id="<%gridID%>_CurrentPage">1</span> 页(第 <span id="<%gridID%>_PageStart">1</span> 条到第 <span id="<%gridID%>_PageLimit">20</span> 条)，共 <span id="<%gridID%>_TotalPage">234</span> 页(总共<span id="<%gridID%>_TotalCount">10086</span> 条记录)</span><span class="wxPager"><ul class="pager wxPagerHack wxPagerNormalGroup"><li class="previous"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Previous" href="javascript:void(0)">上一页</a></li><li class="next"><a class="wxHideOutline wxNotFloat" id="<%gridID%>_Next" href="javascript:void(0)">下一页</a></li></ul><span class="goPager"><input id="<%gridID%>_SetPage" type="text" class="form-control wxPagerInput"><button id="<%gridID%>_GoPage" class="btn btn-default wxPagerBtn" type="button">Go</button></span></span></div></div>',

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
		_config = opt;
	},

	/**
	 * 读取表格全局配置
	 */
	getGlobalConfig: function(baseKey, key){
		return _config[baseKey][key];
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
 * @return Object 返回 WXJS.UI.GRIDOBJECT
 * @constructor
 * @see WXJS.UI.GRID
 */
WXJS.UI.GRIDOBJECT = function(opt){
	var dom = null;

	//更改this引用
	var me = this;

	//渲染目标不存在则返回
	dom = (typeof opt['render'] == 'string') ? WXJS.TOOL.$(opt['render']) : (typeof opt['render'] == 'object') ? opt['render'] : null;
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
		globalEvent: []
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
	me.reload();
}

/**
 * 渲染表格框架
 */
WXJS.UI.GRIDOBJECT.prototype.renderTpl = function(dom){
	dom.innerHTML = WXJS.UI.GRID._tpl.replace(/<%gridID%>/g, this._getConfig('id'));
}

/**
 * 表格配置项
 */
WXJS.UI.GRIDOBJECT.prototype.init = function(opt){
	var me = this;

	//是否要去增加mutiSelect框
	!opt.mutiSelect || mutiSelectInit();

	this._setConfig('id', opt.id);
	this._setConfig('map', opt.map);
	this._setConfig('ajaxUrl', opt.ajaxUrl);
	this._setConfig('pageSize', opt.pageSize);
	this._setConfig('title', opt.title);

	//事件绑定
	this._getConfig('globalEvent').push(opt.globalEvent);

	//设置遮罩id
	this._setConfig('maskId', [opt.id, '_mask'].join(''));

	//多选框配置
	function mutiSelectInit(){
		opt.map.unshift({
			'index': 'checkbox', 
			'name': '<div style="text-align:center;"><a href="javascript:void(0)" id="' + opt.id + '_SelectAll">全选</a></br><a href="javascript:void(0)" id="' + opt.id + '_SelectNone">反选</a><div>', 
			'ignore': true, 
			'align': 'center', 
			'style': 'width: 55px;', 
			'renderer': function(val){
				return ['<input ', 'class="', opt.id, '_SelectBox', '"', ' type="checkbox" />'].join('');
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
			WXJS.TOOL.jq(tr).find('.' + opt.id + '_SelectBox')[0].checked = !WXJS.TOOL.jq(tr).find('.' + opt.id + '_SelectBox')[0].checked; //太sb了
		});

		WXJS.UI.GRID.addAfter(function(){
			WXJS.TOOL.jq('#' + opt.id + '_SelectAll').bind('click', function(){
				WXJS.TOOL.jq('.' + opt.id + '_SelectBox').each(function(){
					this.checked = true;
				})
			});

			WXJS.TOOL.jq('#' + opt.id + '_SelectNone').bind('click', function(){
				WXJS.TOOL.jq('.' + opt.id + '_SelectBox').each(function(){
					this.checked = false;
				})
			})
		})

		WXJS.UI.GRID.extend({
			'getSelectColumns': function(){
				var cols = [];
				WXJS.TOOL.jq('.' + opt.id + '_SelectBox').each(function(num){
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
 * 备注
 * 这里要封装js底层方法
 */
WXJS.UI.GRIDOBJECT.prototype.gridInit = function(){
	var me  = this;
	//-------------------------------------------下面要重构---------------------------------------
	var buff = document.createDocumentFragment();
	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var theadId = [me._getConfig('id'), '_GridThead'].join('');

	table.id = me._getConfig('id');
	table.className = WXJS.UI.GRID._commonStyle;
	thead.innerHTML = me._generateThead(me._getConfig('map'));

	me.thead = thead;
	me.tbody = tbody;

	table.appendChild(thead);
	table.appendChild(tbody);

	buff.appendChild(table);
	WXJS.TOOL.$(me._getConfig('id') + '_GridBox').appendChild(buff);
	//-------------------------------------------重构 end---------------------------------------

	//设置标题如果有的话
	if(this._getConfig('title')){
		WXJS.TOOL.$(this._getConfig('id') + '_GridTitle').innerHTML = this._getConfig('title');
	}

	WXJS.TOOL.jq('#' + theadId + ' .' + WXJS.UI.GRID._sortOperator).bind('click', theadSort);

	//绑定排序事件
	function theadSort(){
		var sortStatus = this.lastElementChild.getAttribute('data-sort'),
			newStatus = '',
			newStyle = '';

		//页数置为1
		me._setConfig('currentPage', 1);

		WXJS.TOOL.jq('#' + theadId + ' span').each(function(){
			WXJS.TOOL.jq(this).hasClass(_displayDisable) || WXJS.TOOL.jq(this).addClass(_displayDisable)
			this.setAttribute('data-sort', '');
		})

		newStatus = (sortStatus == null || sortStatus == '') ? 'desc' : (sortStatus == 'desc') ? 'asc' : 'desc';
		newStyle = (newStatus == 'desc') ? _sortDownIcon : _sortUpIcon;

		this.lastElementChild.setAttribute('data-sort', newStatus);

		WXJS.TOOL.jq(this).find('.' + newStyle).removeClass(_displayDisable);

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
WXJS.UI.GRIDOBJECT.prototype._generateThead = function(map){
	var buff = [], tmp, sortStyle, style, i;
	for(i = 0; i < map.length; i++){
		tmp = map[i]['name'] || map[i]['index'];

		sortStyle = (typeof map[i]['sort'] == 'undefined') ? '' : WXJS.UI.GRID._sortStyle;

		buff.push(
			[
				'<th class="wxThead ', sortStyle, 
				'" data-index="', map[i]['index'], 
				'">'
			].join('')
		);

		buff.push(tmp);

		if(sortStyle) 
			buff.push(['<div class="wxSort"><span class="glyphicon ', WXJS.UI.GRID._sortUpIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span><span class="glyphicon ', WXJS.UI.GRID._sortDownIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span></div>'].join(''));

		buff.push('</th>');
	}

	return ['<thead><tr id="', this._getConfig('id') ,'_GridThead">', buff.join(''), '</tr></thead>'].join('');
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
		align;

	for(var i = 0; i < data.length; i++){
		buff.push([
			'<tr',
			' class="', this._getConfig('id'), '_GridTr"',
			'>'
		].join(''));

		for(var j = 0; j < mapLength; j++){
			if(typeof data[i][map[j]['index']] != 'undefined' || map[j]['ignore'] == true){
				if(typeof map[j]['renderer'] == 'function'){
					tmp = (map[j]['renderer'])(data[i][map[j]['index']]);
				}else{
					tmp = data[i][map[j]['index']];
				}
			}

			style = map[j]['style'] || '';
			align = WXJS.UI.GRID._align[map[j]['align']] || '';

			buff.push([
				'<td',
				' style="', style, align, '"',
				' class="', this._getConfig('id'), '_GridTd_', j, '">', 
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
 * 读取原生数据
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
 *	myGrid.reload(condition);
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

	WXJS.TOOL.ajax({
		type: 'POST',
		url: this._getConfig('ajaxUrl') + '&' + this.getBaseQueryStr() + '&' + parseCondition()['get'],
		dataType: 'json',
		data: this.getProQueryStr() + '&' + parseCondition()['post'],
		success: function(data){
	    	me._setConfig('data', getReceiveData(data, WXJS.UI.GRID.getGlobalConfig('receiveParams', 'data')));
	    	me._setConfig('totalCount', parseInt(getReceiveData(data, WXJS.UI.GRID.getGlobalConfig('receiveParams', 'total'))));
	    	me._load();
	    	me._renderPageInfo();
	    	me._bind();

	    	_setBtnDisable();
	    	maskHide();

	    	//表格渲染结束运行
	    	me.afterInit();
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
			WXJS.TOOL.jq('#' + Previous).parent().addClass(WXJS.UI.GRID._disableStyle);
		}else{
			WXJS.TOOL.jq('#' + Previous).parent().removeClass(WXJS.UI.GRID._disableStyle);
		}
		if(me._getConfig('currentPage') == totalPage){
			WXJS.TOOL.jq('#' + Next).parent().addClass(WXJS.UI.GRID._disableStyle);
		}else{
			WXJS.TOOL.jq('#' + Next).parent().removeClass(WXJS.UI.GRID._disableStyle);
		}
	}

	//初始化页数、排序
	function ajaxInit(){
		me._setConfig('currentPage', 1);
		me._setConfig('sort', '');
		me._setConfig('dir', '');
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
WXJS.UI.GRIDOBJECT.prototype._load = function(){
	var buff = this._generateData(this._getConfig('data'), this._getConfig('map'));
	this.tbody.innerHTML = buff;
}

/**
 *生成表格ajax基本查询（起始、分页数量、排序列、排序升降）
 */
WXJS.UI.GRIDOBJECT.prototype.getBaseQueryStr = function(){
	var baseBuff = [
		WXJS.UI.GRID.getGlobalConfig('sendParams', 'start'), '=', (this._getConfig('currentPage') - 1) * this._getConfig('pageSize'), 
		'&', 
		WXJS.UI.GRID.getGlobalConfig('sendParams', 'limit') , '=', this._getConfig('pageSize'),
		'&',
		WXJS.UI.GRID.getGlobalConfig('sendParams', 'sort'), '=', this._getConfig('sort'),
		'&',
		WXJS.UI.GRID.getGlobalConfig('sendParams', 'dir'), '=', this._getConfig('dir')
	].join('');
	return baseBuff;
}

/**
 * 生成表格的业务查询
 * 这个方法改成post自定义拼装方法，用于一些需要post很复杂的数据，如datatable中的aodata
 * 新方法中默认返回空，如需要自定义则用gird.extend('getProQueryStr': func)
 */
WXJS.UI.GRIDOBJECT.prototype.getProQueryStr = function(){
	/*var proBuff = [],
		params = this._getConfig('baseParams');

	for(var key in params){
		proBuff.push([key, '=', params[key]].join(''));
	}

	return proBuff.join('&');*/
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
		(function(index){
			WXJS.TOOL.jq(['.', girdId, '_GridTr'].join('')).bind('click', (function(e){
				packageEvent(e, this, globalEvents[index]);
			}));
		})(i)
		
		cursorFlag || WXJS.TOOL.jq('#' + girdId + ' tbody').css('cursor', 'pointer');
		cursorFlag = true;
	}

	//绑定列事件
	for(var i = 0; i < this._getConfig('map').length; i++){
		if(typeof this._getConfig('map')[i]['event'] == 'object'){
			for(var j in this._getConfig('map')[i]['event']){
				//再封装一层闭包传入i, j防止闭包传入引用
				(function(i, j){
					WXJS.TOOL.jq(['.', girdId, '_GridTd_', i].join('')).bind(j, (function(e){
						packageEvent(e, this, me._getConfig('map')[i]['event'][j])
					}));
				})(i, j)

				//阻止事件传递
				WXJS.TOOL.jq(['.', girdId, '_GridTd_', i].join('')).bind(j, function(e){
					e.stopPropagation();
				})
				//加手型
				.css('cursor', 'pointer');
			}
		}
	}

	//恶心的逻辑获取事件列的父tr，计算相对位置并返回原生数据（要重构）
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
WXJS.UI.GRIDOBJECT.prototype.pageInit = function(){
	var gridId = this._getConfig('id'),
		Previous = [gridId, '_Previous'].join('');
		Next = [gridId, '_Next'].join(''),
		GoPage = [gridId, '_GoPage'].join(''),

		//只计算一次，避免浪费计算
		totalPage = Math.ceil(this._getConfig('totalCount') / this._getConfig('pageSize')),

		me = this;

	//用闭包传入不同的this引用
	(function(me){
		WXJS.TOOL.bind(Previous, 'click', function(){
			previous(me);
		});
		WXJS.TOOL.bind(Next, 'click', function(){
			next(me);
		});
		WXJS.TOOL.bind(GoPage, 'click', function(){
			goPage(me);
		});
	})(me)
	
	function previous(me){
		if(!_checkDisable(this)) return;

		var currentPage = (me._getConfig('currentPage') == 1) ? 1 : me._getConfig('currentPage') - 1;
		me._setConfig('currentPage', currentPage);

		me.reload();
	}

	function next(me){
		if(!_checkDisable(this)) return;

		var currentPage = (me._getConfig('currentPage') == totalPage) ? totalPage : me._getConfig('currentPage') + 1;
		me._setConfig('currentPage', currentPage);

		me.reload();
	}

	function _checkDisable(obj){
		return !WXJS.TOOL.jq(obj).parent().hasClass(WXJS.UI.GRID._disableStyle)
	}

	function goPage(me){
		var page = WXJS.TOOL.jq('#' + me._getConfig('id') + '_SetPage').val();
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
WXJS.UI.GRIDOBJECT.prototype._renderPageInfo = function(){
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