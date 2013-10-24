WXJS.UI.GRID.extend({
	'_sEcho': 0,

	'_sSearch': '',

	'getProQueryStr': function(){
		var sEcho = 0, //貌似是datatable按一下就+1，不知道有什么用
			iColumns = this._getConfig('map').length,
			iDisplayStart = (this._getConfig('currentPage') - 1) * this._getConfig('pageSize'),
			iDisplayLength = this._getConfig('pageSize'),
			params = [];

		params.push({'name': 'sEcho', 'value': this._sEcho}); //sEcho
		params.push({'name': 'iColumns', 'value': iColumns});
		params.push({'name': 'iDisplayStart', 'value': iDisplayStart});
		params.push({'name': 'iDisplayLength', 'value': iDisplayLength});
		params.push({'name': 'sSearch', 'value': this._sSearch})
		this._sEcho++;

		return encodeURI('aoData=' + JSON.stringify(params));
	}
})

WXJS.UI.GRID.addAfter(function(grid){
	var key, value, condition = {'post': {}};
	//要重构，这里为了解决问题假如unbind，否则会绑定多次事件
	$('.' + grid._getConfig('id') + '_SearchInput').unbind();
	$('.' + grid._getConfig('id') + '_SearchInput').bind('keypress', function(e){
		if(e.keyCode == '13'){
			search(this);
		}
	})

	function search(obj){
		key = $(obj).attr('data-index');
		value = $(obj).val();
		grid._sSearch = value;

		grid.reload(null, true);
	}
})