<?php
	require_once '../../phpModule/pcmgr_log.class.php';

	$msg = $_GET['msg'];

	$msg = date('Y-m-d H:i:s') . ' msg: ' . $msg;

	try{
		Plog::log($msg);
	}catch(Exception $e){
		var_dump($e->getMessage());
	}
	

?>
