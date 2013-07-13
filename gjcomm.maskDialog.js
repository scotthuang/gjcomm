/**
 * MGR.maskDialog 蒙板弹窗展示工具
 * @version 1.0
 * @author scotthuang
 * @description 建立全局的半透明蒙板弹窗
 */

var MGR = MGR || {};
MGR.maskDialog = MGR.maskDialog || {
	//最后的弹窗id
	_dialogDom: null,
	_dialogDomList: [],

	show: function(dialogId, opts, zIndex){
		this._dialogDom = document.getElementById(dialogId);
		if(!this._dialogDom){
			return false;
		}

		opts = opts || {};

		//设置静态蒙板层级优先度
		zIndex = zIndex || 9999;
		this.setzIndex(zIndex - 1);

		//设置静态蒙板层级透明度
		var t = parseFloat(opts.opacity, 10);
		//opts.opacity = isNaN(t) ? 0.2 : t;
		this.setOpacity(isNaN(t) ? 0.2 : t);

		var cssText = 'display: block; position: fixed;_position: abusolute; left: ' + ((opts.left) ? opts.left : '50%;') + 'top: ' + ((opts.top) ? opts.top : '50%;') + 
		'z-index: ' + zIndex + ';';

		this._dialogDom.style.cssText = cssText;
		this._dialogDomList.push(this._dialogDom);

		//打开蒙板
		this.maskShow();
	},

	close: function(){
		this._dialogDom.style.display = 'none';
		this._dialogDomList.pop();

		//关闭蒙板
		this.maskClose();
	}
};

//静态蒙板变量
(function(){
	//蒙板实例
	var masker = null;
	//蒙板引用计数器
	var count = 0;
	//蒙板透明度
	var opacity = 0.2;
	//弹窗层级优先度
	var zIndex = 0;

	MGR.maskDialog.maskShow = function(){
		count++;

		if(masker){
			return count;
		}

		//蒙板css
		var cssText = 'background-color:#000;filter:alpha(opacity=' + 100 * opacity + ');opacity:' + opacity + ';position:fixed;_position:absolute;left:0px;top:0px;z-index:' + zIndex + ';width:100%;height:' + document.body.clientHeight + '; _height:' + document.body.scrollHeight + 'px;';
		//关闭ie9滤镜渲染
		cssText += 'filter:none\\9\\0;';

		//创建蒙板
		masker = document.createElement('div');

		masker.id = 'mgr_mask';
		masker.style.cssText = cssText

		document.body.appendChild(masker);
		return count;
	}

	MGR.maskDialog.setOpacity = function(opa){
		return function(opacity){
			opacity = opa;
		}
	}

	MGR.maskDialog.setzIndex = function(z){
		return function(opacity){
			zIndex = z;
		}
	}

	MGR.maskDialog.maskClose = function(rmAll){
		count = Math.max(--count, 0);

		if(!count || rmAll){
			QZFL.dom.removeElement(masker);
			masker = null;

			rmAll && (count = 0);
		}
	}

})();