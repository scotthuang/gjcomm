<?php
	$data = array(
		'rettip' => 'suc',
		'success' => 'true',
		'result' => array(
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
			array('id' => 1, 'data' => 2),
		),
		'totalCount' => 75
	);

	foreach($data['result'] as &$d){
		$d['id'] = rand();
		$d['data'] = rand();
	}

	sleep(1);
	echo json_encode($data);
?>