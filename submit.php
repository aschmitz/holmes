<?
$referer = $_SERVER['HTTP_REFERER'];

$log = json_decode($_REQUEST['log']);
if (!is_array($log)) { die('Bad log?'); }

$skipDisplay = Array('start', 'end');

foreach($log as $entry) {
	switch ($entry[1]) {
		case 'start':
			$logStart = $entry[0];
			break;
		case 'end':
			$logEnd = $entry[0];
			break;
		case 'funcStart':
			$functionCalls[$entry[2]] = Array(
				'start' => $entry[0],
				'name' => $entry[3][0],
				'arguments' => $entry[3][1]
			);
			break;
		case 'funcEnd':
			$functionCalls[$entry[2]]['end'] = $entry[0];
			$functionCalls[$entry[2]]['length'] = $entry[0] - $functionCalls[$entry[2]]['start'];
			$functionCalls[$entry[2]]['return'] = $entry[3];
			break;
	}
}

function threeDec($value) {
	if (strpos($value, '.') === false) { $value = $value.'.000'; }
	while(strlen($value) - strpos($value, '.') < 4) {
		$value = $value.'0';
	}
	return $value;
}
function toTime($ms) {
	return threeDec($ms/1000);
}

function h($in) { return htmlentities($in); }

unset($_REQUEST['log']);
unset($_REQUEST['ET']);
?>
<html>
<head><title>Holmes Debugger</title></head>
<style type="text/css">
body, input, table, th, td {
	font-family: Verdana, sans-serif;
	background-color: #fff;
	font-size: 10pt;
	color: #000;
}
h1, h2, h3, h4, h5, h6 {
	margin-top: 0.5em;
	margin-bottom: 0.5em;
}
table {
	border: 2px #000 solid;
	border-collapse: collapse;
}
th {
	background-color: #F1FFB9;
}
td, th {
	border-collapse: collapse;
	border: 1px #000 solid;
	padding: 0.5em;
}
.logEntryfuncEnd td {
	background-color: #ddd;
}
</style>
<script type="text/javascript">
// From http://javascript.about.com/library/bldom08.htm
if (!document.getElementsByClassName) {
	document.getElementsByClassName = function(cl) {
		var retnode = [];
		var myclass = new RegExp('\\b'+cl+'\\b');
		var elem = this.getElementsByTagName('*');
		for (var i = 0; i < elem.length; i++) {
			var classes = elem[i].className;
			if (myclass.test(classes)) retnode.push(elem[i]);
		}
		return retnode;
	};
}

var showReturns = true;

function toggleReturns() {
	showReturns = !showReturns;
	var displayStyle = showReturns ? '' : 'none';
	returns = document.getElementsByClassName('logEntryfuncEnd');
	for(var i=0; i<returns.length; i++) {
		returns[i].style.display = displayStyle;
	}
	document.getElementById('toggleReturnsButton').value = showReturns ? 'Hide Function Returns' : 'Show Function Returns';
}
</script>
</head>
<body onload="toggleReturns();">
<h1>Holmes Debug View</h1>
<h2>Context</h2>
Referrer: <?= htmlentities($referer) ?><br />
<? if (count($_REQUEST) > 0) { ?>
	Other variables: <blockquote><table><tr><th>Name</th><th>Value</th></tr>
	<? foreach($_REQUEST as $name => $value) { ?>
		<tr><td><?=htmlentities($name)?></td><td><?=htmlentities($value)?></td></tr>
	<? } ?>
	</table></blockquote>
<? } ?>
<h2>Log</h2>
Log timestamp: <?= date('D, d M Y g:i:s a', $logStart / 1000) ?><br />
Log length: <?= round(($logEnd - $logStart) / 1000, 1) ?> seconds<br />
<input type="button" onclick="toggleReturns();" id="toggleReturnsButton" value="Hide Function Returns" /><br />
<blockquote><table><tr><th>Time (sec)</th><th>Type</th><th>ID</th><th>Name</th><th>Arguments</th><th>Return</th><th>Elapsed (sec)</th></tr>
<? foreach($log as $entry) {
	if (!in_array($entry[1], $skipDisplay)) { ?>
	<tr class="logEntry<?=h($entry[1])?>">
		<td><?= toTime($entry[0] - $logStart) ?></td>
		<? switch($entry[1]) {
			case 'funcStart':
				echo '<td>Call</td>';
				echo '<td>'.h($entry[2]).'</td>';
				echo '<td>'.h($functionCalls[$entry[2]]['name']).'</td>';
				echo '<td>'.h(json_encode($functionCalls[$entry[2]]['arguments'])).'</td>';
				echo '<td>'.h(json_encode($functionCalls[$entry[2]]['return'])).'</td>';
				if (isset($functionCalls[$entry[2]]['length'])) {
					echo '<td>'.h(toTime($functionCalls[$entry[2]]['length'])).'</td>';
				} else {
					echo '<td>No return</td>';
				}
				break;
			case 'funcEnd':
				echo '<td>Return</td>';
				echo '<td>'.h($entry[2]).'</td>';
				echo '<td colspan="2">'.h($functionCalls[$entry[2]]['name']).'</td>';
				echo '<td>'.h(json_encode($functionCalls[$entry[2]]['return'])).'</td>';
				echo '<td>'.h(toTime($functionCalls[$entry[2]]['length'])).'</td>';
				break;
			case 'custom':
				echo '<td>Custom</td>';
				echo '<td colspan="4">'.h(json_encode($entry[2])).'</td>';
				break;
		}?>
	</tr>
<?	}
} ?>
</table></blockquote>
</body>
</html>














