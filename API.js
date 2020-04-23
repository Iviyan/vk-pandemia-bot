const request = require('request');

const v = 5.103;
const app_id = 7303130;
const gameAPI_url = 'https://coronapi.coronavirus.com.ru/';
const vkAPI_url = 'https://api.vk.com/method/';

function aReq(params, status_code) {
	status_code = status_code || 200;
	return new Promise(function (resolve, reject) {
		request(params, function (error, res, body) { //console.log(res);
			if (!error && res.statusCode == status_code) {
				resolve(body);
			} else {
				if (error)
					reject(error);
				else
					reject({statusCode:res.statusCode, body: body});
			}
		});
	});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Object.filter = (obj, predicate) => 
	Object.keys(obj)
		.filter( key => predicate(obj[key]) )
		.reduce( (res, key) => (res[key] = obj[key], res), {} );

		  

class session {
	#isAuth = false;
	
	auth_id = '';
	
	authp; //URLSearchParams
	hc = 0; //Health
	dc = 0; //infection(damage)
	isDeath = false;
	timeToLife = 0; //Время, через которое вы возродитесь
	damage = 0; // Урон по вам
	bafs = {}; //Бонусы
	gmine_h = 0; gmine_d = 0; //Доход в минуту
	#min_h = '2h';
	#min_d = 0;
	
	get min_h() { return this.math_min(this.#min_h, this.gmine_h); }
	get min_d() { return this.math_min(this.#min_d, this.gmine_d); }
	
	set min_h(s) { if (this.math_min(s) != NaN) this.#min_h = s; }
	set min_d(s) { if (this.math_min(s) != NaN) this.#min_d = s; }

	math_min(str, mine) {
		if (/^\d+$/.test(str)) return parseInt(str);
		if (/^\d+(s|m|h)$/.test(str)) {
			var ex = /(^\d+)(s|m|h)$/.exec(str);
			var num = parseInt(ex[1]);
			var mul = ex[2];
			switch (mul) {
				case 's': return mine * num/60; break;
				case 'm': return mine * num; break;
				case 'h': return mine * num*60; break;
			}
		}
		return NaN;
	}
	
	upg_d = [
		{
			id: 1,
			name: 'Комары',
			alias: 'mosquitoes',
			mine: 1,
			cost_: 25,
			count: 0
		},
		{
			id: 2,
			name: 'Грязная вода',
			alias: 'dirty_water',
			mine: 2,
			cost_: 75,
			count: 0
		},
		{
			id: 3,
			name: 'Простуда',
			alias: 'cold',
			mine: 4,
			cost_: 200,
			count: 0
		},
		{
			id: 4,
			name: 'Вирусы',
			alias: 'virus',
			mine: 10,
			cost_: 450,
			count: 0
		},
		{
			id: 5,
			name: 'Коронавирус',
			alias: 'coronavirus',
			mine: 30,
			cost_: 2000,
			count: 0
		},
		{
			id: 6,
			name: 'Коронавирус+',
			alias: 'mutations_coronavirus',
			mine: 50,
			cost_: 7000,
			count: 0
		},
		{
			id: 7,
			name: 'Пневмония',
			alias: 'pnevmonia',
			mine: 60,
			cost_: 15000,
			count: 0
		}
	];
	
	upg_h = [
		{
			id: 1,
			name: "Маски",
			alias: "mask",
			mine: 1,
			cost_: 20,
			count: 0
		},
		{
			id: 2,
			name: "Респираторы",
			alias: "respirator",
			mine: 2,
			cost_: 50,
			count: 0
		},
		{
			id: 3,
			name: "Витамины",
			alias: "vitamins",
			mine: 4,
			cost_: 150,
			count: 0
		},
		{
			id: 4,
			name: "Больница",
			alias: "hospital",
			mine: 10,
			cost_: 300,
			count: 0
		},
		{
			id: 5,
			name: "Фабрика по производству лекарств",
			alias: "fabric",
			mine: 30,
			cost_: 1500,
			count: 0
		},
		{
			id: 6,
			name: "НИИ",
			alias: "nii",
			mine: 50,
			cost_: 5000,
			count: 0
		},
		{
			id: 7,
			name: "Отряд ученых",
			alias: "scientists",
			mine: 60,
			cost_: 15000,
			count: 0
		}
	];
	
	constructor() {
	};
	
	async api_sign() {
		var resp;
		try {
			resp = await aReq(
				{
					method: 'GET',
					url: gameAPI_url + 'sign?' + this.authp.toString(),
				}
			);
		}
		catch (err) {
			if (err instanceof Error) {
				throw {error: 1, description: 'Ошибка запроса к серверу игры', error_object: err};
			} else {
				throw {error: 2, description: 'Ошибка запроса к серверу игры', error_object: err};
			}
		};
		return true;
	}
	
	async api_users_get() {
		var resp;
		try {
			resp = await aReq(
				{
					method: 'GET',
					url: gameAPI_url + 'users/get?' + this.authp.toString(),
				}
			);
		}
		catch (err) {
			if (err instanceof Error) {
				throw {error: 1, description: 'Ошибка запроса к серверу игры', error_object: err};
			} else {
				throw {error: 2, description: 'Ошибка запроса к серверу игры', error_object: err};
			}
		};
		var resp = JSON.parse(resp);
		
		this.hc = Math.trunc(resp.health);
		this.dc = Math.trunc(resp.infection);
		this.damage = resp.damage;
		this.isDeath = resp.isDeath;
		if (this.isDeath) this.timeToLife = resp.timeToLife; else this.timeToLife = 0;
		
		return resp;
	}
	
	async api_boosters_get() {
		var resp;
		try {
			resp = await aReq(
				{
					method: 'GET',
					url: gameAPI_url + 'boosters/get?' + this.authp.toString()
				}
			);
		} catch (err) {
			if (err instanceof Error) {
				throw {error: 1, description: 'Ошибка запроса к серверу игры', error_object: err};
			} else {
				throw {error: 2, description: 'Ошибка запроса к серверу игры', error_object: err};
			}
		}
		
		var resp = JSON.parse(resp);
		
		return resp;
	}
	
	
	async authByToken(token) {
		var resp;
		try {
			resp = await aReq({
				method: 'GET',
				url: vkAPI_url + 'apps.get',
				qs: {
					access_token: token,
					v: v,
					app_id: app_id
				}
			});
		}
		catch (err) {
			throw {error: 1, description: 'Ошибка запроса к vkAPI', error_object: err};
			return;
		};
		
		let j = JSON.parse(resp);
		if (!j.response) {
			throw {error: 2, description: 'Проблема с ответом vkAPI, вероятно неверный токен.', response: resp};
		};
		
		var mobile_iframe_url = j.response.items[0].mobile_iframe_url;
		if (mobile_iframe_url == undefined) {
			throw {error: 3, description: 'Проблема с ответом vkAPI\n(Токен должен быть получен как от Android приложения).', response: resp};
		}
		console.log('url:  ', mobile_iframe_url);
		var url = new URL(mobile_iframe_url);
		this.authp = url.searchParams;
		

		var resp_ug;
		try {
			await this.api_sign();
			
			resp_ug = await this.api_users_get();
		}
		catch (err) {
			throw {error: 4, description: 'Ошибка запроса к серверу игры', error_object: err};
			return;
		};
		
		this.auth_id = resp_ug._id;
		this.authp.set('userId', this.auth_id);
		
		console.log(`\n -Здоровье: +${this.hc}\n -Атака: +${this.dc}`);
		
		if (this.isDeath) {
			console.log(` !> Вы мертвы, время для возрождения: ${this.timeToLife}`);
		}
		
		if (this.damage) {
			console.log(' !> По вам идёт урон: ', this.damage);
		}
		
		this.bafs = resp_ug.bafs;
		var {h,i} = this.bafs.reduce(function(s,o) {return {h: s.h+o.health, i: s.i+o.infection}}, {h:0,i:0});
		console.log(`\n> Эффекты:\n -Здоровье: +${h}\n -Атака: +${i}`);
		
		this.#isAuth = true;			
	}
	
	async updatePoints(show) {
		if (!this.#isAuth) throw {error: 0, description: 'Необходима авторизация'};
		var resp_ug;
		try {
			resp_ug = await this.api_users_get();
		}
		catch (err) {
			throw {error: 4, description: ' > Ошибка запроса к серверу игры', error_object: err};
			return;
		};
		
		if (show) console.log(`\n -Здоровье: ${this.hc}\n -Атака: ${this.dc}`);
		
		if (this.isDeath) {
			console.log(` !> Вы мертвы, время для возрождения: ${this.timeToLife}`);
		}
		if (this.damage) {
			console.log(' !> По вам идёт урон: ', this.damage);
		};
		
		return true;
	}
	
	async buy(arr) {
		if (!this.#isAuth) throw {error: 0, description: 'Необходима авторизация'};
		if (this.isDeath) throw {error: 0, description: 'Вы мертвы'};
		
		var obj = {alias: arr}; //"{"alias":["mask"]}"
		var url = gameAPI_url + 'boosters/buy?' + this.authp.toString();
		
		try {
			await aReq(
				{
					method: 'POST',
					url: url,
					body: JSON.stringify(obj),
					headers: {
						"content-type": "application/json;charset=UTF-8"
					}
				}, 
				201
			);
		} catch (err) {
			if (err instanceof Error) {
				throw {error: 1, description: 'Ошибка запроса к серверу игры', error_object: err};
			} else {
				throw {error: 2, description: 'Ошибка запроса к серверу игры', error_object: err};
			}
		}
		
		return true;
	}
	
	async boostersUpdate() {
		if (!this.#isAuth) throw {error: 0, description: 'Необходима авторизация'};
		
		var resp;
		try {
			resp = await this.api_boosters_get();
		} catch (err) {
			throw err;
		}
		
		for (let o of resp) {
			if (o.isHealth) {
				let ind = this.upg_h.findIndex(x => x.mine == o.health);
				this.upg_h[ind].count = o.count;
				this.upg_h[ind].cost = (this.upg_h[ind].count + 1) * this.upg_h[ind].cost_;
			} else {
				let ind = this.upg_d.findIndex(x => x.mine == o.infection);
				this.upg_d[ind].count = o.count;
				this.upg_d[ind].cost = (this.upg_d[ind].count + 1) * this.upg_d[ind].cost_;
			}
		};
		
		this.calcMine(true);
		return true;
	}
	
	calcMine(show, calc) {
		if (!calc) {
			this.gmine_h = 0; this.gmine_d = 0;
			for (let o of this.upg_d) this.gmine_d += o.mine * o.count;
			for (let o of this.upg_h) this.gmine_h += o.mine * o.count;
		};
		
		if (show) console.log('\n>Скорость добычи:',
			'\n -Очки здоровья: ',this.gmine_h, '/мин | ', (this.gmine_h/60).toFixed(2), '/сек', 
			'\n -Очки атаки: ',   this.gmine_d, '/мин | ', (this.gmine_d/60).toFixed(2), '/сек');
	}
	
	async smartBuy_d() {
		if (!this.#isAuth) throw {error: 0, description: 'Необходима авторизация'};
		if (this.isDeath) throw {error: 0, description: 'Вы мертвы'};
		
		var upgs = this.upg_d.reduce((res,obj)=>(res[obj.alias] = 0,res),{});
		
		var li = this.upg_d.length - 1;
		var add = -1;
		while (add) { 
			add = 0;
			var cost_last = this.upg_d[li].cost;
			var mine_last = this.upg_d[li].mine;
			var costs_p = this.upg_d.map((o,i) => cost_last / mine_last * o.mine);
			
			for(let i = li-1; i >= 0; i--) {
				while (this.upg_d[i].cost < costs_p[i] && this.dc - this.upg_d[i].cost > this.min_d) {
					this.dc -= this.upg_d[i].cost;
					this.upg_d[i].cost += this.upg_d[i].cost_;
					this.upg_d[i].count++;
					upgs[this.upg_d[i].alias]++;
					add++;
				}
			};
			if (!add && this.dc - this.upg_d[li].cost > this.min_d) {
				this.dc -= this.upg_d[li].cost;
				this.upg_d[li].cost += this.upg_d[li].cost_;
				this.upg_d[li].count++;
				add++;
				upgs[this.upg_d[li].alias]++;
			};
			if (!this.dc - this.upg_d[li].cost > this.min_d) break;
		};
		
		var arr = [];
		for(let o in upgs)
			for (let i = 0; i < upgs[o]; i++)
				arr.push(o);
			
		if (arr.length == 0) {
			console.log(' > Покупок нет.');
			return;
		};
		
		console.log(
			Object.keys(upgs).reduce( 
				(res, key) => ((upgs[key] > 0) ? res += `\n >${key}: ${upgs[key]}` : '', res),
				'Куплено:'
			)
		);
		while (true) {
			try {
				console.log('\n > Покупка улучшений...');
				await this.buy(arr);
				console.log(' > Покупка успешно завершена');
				break;
			} catch (err) {
				console.log(' > Ошибка покупки: \n', err);
				console.log(' > Ещё одна попытка через 10 секунд...');
				await sleep(10000);
			}
		};
		
		this.calcMine(true);
	}
	
	async smartBuy_h() {
		if (!this.#isAuth) throw {error: 0, description: 'Необходима авторизация'};
		if (this.isDeath) throw {error: 0, description: 'Вы мертвы'};
		
		var upgs = this.upg_h.reduce((res,obj)=>(res[obj.alias] = 0,res),{});
		
		var li = this.upg_h.length - 1;
		var add = -1;
		while (add) { 
			add = 0;
			var cost_last = this.upg_h[li].cost;
			var mine_last = this.upg_h[li].mine;
			var costs_p = this.upg_h.map((o,i) => cost_last / mine_last * o.mine);
			
			for(let i = li-1; i >= 0; i--) {
				while (this.upg_h[i].cost < costs_p[i] && this.hc - this.upg_h[i].cost > this.min_h) {
					this.hc -= this.upg_h[i].cost;
					this.upg_h[i].cost += this.upg_h[i].cost_;
					this.upg_h[i].count++;
					upgs[this.upg_h[i].alias]++;
					add++;
				}
			};
			if (!add && this.hc - this.upg_h[li].cost > this.min_h) {
				this.hc -= this.upg_h[li].cost;
				this.upg_h[li].cost += this.upg_h[li].cost_;
				this.upg_h[li].count++;
				add++;
				upgs[this.upg_h[li].alias]++;
			};
			if (!this.hc - this.upg_h[li].cost > this.min_h) break;
		};
		
		var arr = [];
		for(let o in upgs)
			for (let i = 0; i < upgs[o]; i++)
				arr.push(o);
			
		if (arr.length == 0) {
			console.log(' > Покупок нет.');
			return;
		};
		
		console.log(
			Object.keys(upgs).reduce( 
				(res, key) => ((upgs[key] > 0) ? res += `\n >${key}: ${upgs[key]}` : '', res),
				'Куплено:'
			)
		);
		
		while (true) {
			try {
				console.log('\n > Покупка улучшений...');
				await this.buy(arr);
				console.log(' > Покупка успешно завершена');
				break;
			} catch (err) {
				console.log(' > Ошибка покупки: \n', err);
				console.log(' > Ещё одна попытка через 10 секунд...');
				await sleep(10000);
			}
		};
		
		this.calcMine(true);
	}
	
	get isAuth() {
		return this.#isAuth;
	}
}

module.exports = {
	session,
	aReq,
	sleep
}