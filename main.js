const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(questionText) {
  return new Promise((resolve, reject) => {
    rl.question(questionText, resolve);
  });
};

const {
	session,
	aReq,
	sleep
} = require('./API');

var ses = new session();

async function init() {
	var args = require('minimist')(process.argv.slice(2));
	console.log(args);
	
	var config = (args.useconfig || args.uc);
	var useconfig = false;
	if (config == undefined) config = './config'; else useconfig = true;
	if (config === true) config = './config'; else config = './' + config;
	const config_params = require(config);
	
	var token = (args.token || args.t || config_params.VK_TOKEN);
	while (token == undefined || token == '') {
		token = (await ask('Введите токен: ')).trim();
	}
	
	try {
		console.log('\n > Авторизация...\n')
		await ses.authByToken(token);
	} catch (err) {
		console.log(' > Ошибка авторизации', err);
		return;
	}
	
	try {
		console.log('\n > Обноление информации об улучшениях...');
		await ses.boostersUpdate(); //console.log(ses.upg_h);
	} catch (err) {
		console.log(' > Ошибка получения информации об улучшениях: \n', err);
		return;
	}
	
	console.log('\n > Авторизация успешно завершена\n');
	console.log(
`
Команды: (-cmd or --command ...params... )
 -sb (smartbuy) h(health) / i(infection) "-sb h" = закупить улучшения здоровья
 -sb h/i t(timer) <time> (-sb i t 120 (или 2m) = закупка нападения раз в 2 минуты)
    <time> 1h = 60m = 3600s = 3600
	-sb h/i t = удаление таймера
 -sb min h/i <count> (минимальное количество очков) "-sb min h 1000000",  "-sb min h 2h" - по умолчанию
    *вместо числа можно написать "2h", что означает колличество очков, добываемые за 2 часа
 -show mine (-s m) - показывает текущую скорость добычи
 -show bafs (-s b) Показать бонусы (в JSON)
 -show points (-s p) Показывает очки здоровья и атаки (также обновляет информацию о пользователе)
`);
	
	/*try {
		await ses.buy(['mask']);
	} catch (err) {
		console.log('Ошибка покупки: \n', err);
		return;
	}*/
	
	//await ses.smartBuy_h();
	//await ses.smartBuy_d();
	
	if (useconfig && config_params.start_commands.length > 0) {
		console.log('> Выполнение комманд из конфига...');
		for (let c of config_params.start_commands) {
			console.log('\n_> ', c);
			await cmd(c);
			await sleep(1000);
		}
	};
	
	process.stdout.write("\n_> ");
}

init();

var death_h = false, death_i = false;
var ti_h, ti_i;
function ifDeath() {
	if (ses.isDeath) {
		console.log(`Т.к. вы мертвы, таймеры будут приостановлены на ${ses.timeToLife}`);
		if (sbiInterval != 0) clearInterval(sbiInterval);
		if (sbhInterval != 0) clearInterval(sbhInterval);
		var ttl_ = ses.timeToLife.split(':');
		var tm = parseInterval(ttl_[0]+'h') + parseInterval(ttl_[1]+'m');
		death_h = Boolean(sbhInterval);
		death_i = Boolean(sbiInterval);
		setTimeout(
			function() {
				if (death_h) {
					sbhInterval = setInterval(sbhIfunc, ti_h);
					console.log(' > Таймер здоровья успешно возобновлён');
				};
				if (death_i) {
					sbhInterval = setInterval(sbhIfunc, ti_i);
					console.log(' > Таймер атаки успешно возобновлён');
				};
			}, tm);
		return true;
	};
};

var sbhInterval = 0;
var sbhIfunc = async function() {
	try {
		await ses.updatePoints();
		if (ses.damage > 0) {
			console.log(' > Вас атакуют, покупка улучшений отменена');
			return;
		}
		if (ifDeath()) return;
		await ses.smartBuy_h();
	} catch (e) {
		console.log(e);
	};
}
var sbiInterval = 0;
var sbiIfunc = async function() {
	try {
		await ses.updatePoints();
		if (ifDeath()) return;
		await ses.smartBuy_d();
	} catch (e) {
		console.log(e);
	};
}

function parseInterval(str) {
	if (/^\d+$/.test(str)) return parseInt(str) * 1000;
	if (/^\d+(s|m|h)$/.test(str)) {
		var ex = /(^\d+)(s|m|h)$/.exec(str);
		var num = parseInt(ex[1]) * 1000;
		var mul = ex[2];
		switch (mul) {
			case 's': return num; break;
			case 'm': return num*60; break;
			case 'h': return num*60*60; break;
		}
	}
	return NaN;
}

async function cmd(line) {
	if (line[0] == '-') line = line.substr(1);
	var args = line.split(' ');
	
	if (args[0] == 'sb' || args[0] == 'smartbuy') {
		if (args[2] == 't' || args[2] == 'timer') {
			
			var ti = parseInterval(args[3]);
			if (ti != NaN || args[3] == undefined) {
				if (args[1] == 'h' || args[1] == 'health')
					if (sbhInterval == 0) {
						sbhInterval = setInterval(sbhIfunc, ti);
						ti_h = ti;
						console.log(' > Таймер автозакупки улучшений здоровья успешно создан');
					} else {
						if (args[3] == undefined && sbiInterval != 0) { 
							clearInterval(sbhInterval);
							sbhInterval = 0;
							console.log(' > Таймер успешно удалён');
						} else console.log(' > Таймер уже включён');
					};
				if (args[1] == 'i' || args[1] == 'infection')
					if (sbiInterval == 0) {
						sbiInterval = setInterval(sbiIfunc, ti);
						ti_i = ti;
						console.log(' > Таймер автозакупки улучшений атаки успешно создан');
					} else {
						if (args[3] == undefined && sbiInterval != 0) { 
							clearInterval(sbiInterval);
							sbiInterval = 0;
							console.log(' > Таймер успешно удалён');
						} else console.log(' > Таймер уже включён');
					};
			}
			return;
		}
		
		if (args[1] == 'min') {
			if (parseInterval(args[3]) != NaN) {
				if (args[2] == 'h' || args[2] == 'health') {
					ses.min_h = args[3];
					console.log(' > Минимальное количество очков здоровья успешно установлено: ', ses.min_h);
				}
				if (args[2] == 'i' || args[2] == 'infection') {
					ses.min_d = args[3];
					console.log(' > Минимальное количество очков атаки успешно установлено: ', ses.min_d);
				}
			};
		}
		
		if (args[1] == 'h' || args[1] == 'health') await ses.smartBuy_h();
		if (args[1] == 'i' || args[1] == 'infection') await ses.smartBuy_d();
		return;
	};
	
	if (args[0] == 'show' || args[0] == 's') {
		if (args[1] == 'mine' || args[1] == 'm') ses.calcMine(true, true);
		if (args[1] == 'bafs' || args[1] == 'b') console.log('\n',ses.bafs);
		if (args[1] == 'points' || args[1] == 'p') await ses.updatePoints(true);
	};
}

rl.on('line', async (line) => {
	line = line.trim().toLowerCase();
	if (line[0] == '-') line = line.substr(1);
	
	await cmd(line);
	
	process.stdout.write("\n_> ");
});