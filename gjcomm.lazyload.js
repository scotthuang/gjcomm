var WXJS = WXJS || {};

WXJS.lazyChart = {
	_dom: null,

	_getRect: function(dom){
		var rect = {};
		if("innerHeight" in dom){
			return {
				top: 0,
				left: 0,
				height: dom.innerHeight,
				width: dom.innerWidth
			}
		}

		return this._getDomRect(dom);
	},

	_getScrollOrigin: function(dom){
		var beforeRect = this._getDomRect(dom);
		var afterScrollTop = document.documentElement.scrollTop;
		var afterScrollLeft = document.documentElement.scrollLeft;

		beforeRect.top -= afterScrollTop;
		beforeRect.left -= afterScrollLeft;

		return beforeRect; 
	},

	_getDomRect: function(dom){
		return {
			top: dom.offsetTop,
			left: dom.offsetLeft,
			height: dom.offsetHeight,
			width: dom.offsetWidth
		}
	},

	_init: function(){
		//暂不考虑子容器
		this._dom = window;
	},

	_getElementsByClassName: function(className){
		//暂不考虑兼容性
		return document.getElementsByClassName(className);
	},

	create: function(){
		this._init();

		var me = this;
		var containerRect = me._getRect(me._dom);

		window.onscroll = _bindEvent;
		//document.addEventListener('scroll', _bindEvent, false);

		//开始处理一次
		_bindEvent();

		function _bindEvent(){
			//wx特殊处理
			var chars = me._getElementsByClassName('show-chart');
			var src = '';

			for(var i = 0; i < chars.length; i++){
				if(chars[i].getAttribute('data-load') == null){
					console.log(me._getScrollOrigin(chars[i]));
					if(checkCross(containerRect, me._getScrollOrigin(chars[i]))){
						chars[i].setAttribute('data-load', 1);				
					}else{
						//只允许从上到下，减少不必要的性能损耗
						break;
					}
				}
			}
		}

		//rect1包含rect2
		function checkCross(rect1, rect2){
			var x = rect2.left > rect1.left && (rect2.left + rect2.width) < (rect1.left + rect1.width);
			var y = rect2.top > rect1.top && (rect2.top + rect2.height) < (rect1.top + rect1.height);

			return x && y;
		}
	}
}