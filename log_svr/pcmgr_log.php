<?php
	require_once 'pcmgr_log.class.php';

	$url = $_POST['url'];

	$msg = date('Y-m-d H:i:s') . ' url: ' . $url;

	Plog::log($msg);

?>