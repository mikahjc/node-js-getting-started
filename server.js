const express = require('express');
const path = require('path');
const Promise = require('promise');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');

const pool = new Pool({
	user: 'www-data',
	host: 'localhost',
	database: 'teambuilder',
	password: 'd$DE~jNRB4k.Ew*\'',
	port: 5432
})

function doQuery(sql, params, callback) {
	pool.query(sql, params, function(err, result) {
		if (err) {
			console.log("DB error!");
			console.log(err);
			callback(err, null);
		}

		callback(null, result.rows);
	})
}

function getPokemonFromDex(id, callback) {
	var sql = 'SELECT pv.name, pv.number, pv.type1, pv.type2, pv.previous_evolution, pv.base_hp, pv.base_attack, pv.base_defense, pv.base_special_attack, pv.base_special_defense, pv.base_speed FROM pokemon_view pv WHERE pv.id = $1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getPokemonFromDexAPI(id, callback) {
	var sql = 'SELECT name, number, type1, type2, previous, base_hp, base_attack, base_defense, base_special_attack, base_special_defense, base_speed, gen FROM pokemon WHERE id = $1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getFriendlyPokemonFromPC(id, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members_view WHERE id=$1::int;';
	var params = [id];

	doQuery(sql, params, callback);
}

function getPokemonFromPC(id, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members WHERE id=$1::int;';
	var params = [id];

	doQuery(sql, params, callback);
}

function getTeamFromDB(id, callback) {
	var sql = 'SELECT team_name, member_1, member_2, member_3, member_4, member_5, member_6 FROM teams WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getAllowedMoves(pokemonId, callback) {
	var sql = 'SELECT move, how_learned, learned_at FROM allowed_moves WHERE pokemon=$1::int';
	var params = [pokemonId];

	doQuery(sql, params, callback);
}

function getAllowedAbilities(pokemonId, callback) {
	var sql = 'SELECT ability, hidden FROM allowed_abilities WHERE pokemon=$1::int';
	var params = [pokemonId];

	doQuery(sql, params, callback);
}

function getAbility(id, callback) {
	var sql = 'SELECT name, description FROM abilities WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getMove(id, callback) {
	var sql = 'SELECT m.name, t.name as type, category, power, accuracy, pp, description FROM moves m JOIN types t ON m.type = t.id WHERE m.id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getItem(id, callback) {
	var sql = 'SELECT name, description FROM items WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);
}

function getPCBox(owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members_view WHERE trainer_name=(SELECT trainer_name FROM users WHERE id=$1::int) ORDER BY id';
	var params = [owner];

	doQuery(sql, params, callback);
}

function getPCBoxAPI(owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members WHERE owner=$1::int ORDER BY id';
	var params = [owner];

	doQuery(sql, params, callback);
}

function getTeams(owner, callback) {
	var sql = 'SELECT id, team_name FROM teams WHERE owner=$1::int';
	var params = [owner];

	doQuery(sql, params, callback);
}

// Server Setup

var app = express();

app.get('/trainerTeams/', (req, res) => {
	getTeams(1, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
})

app.get('/pokemon/:id', (req, res) => {
	getPokemonFromDex(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/pokemonAPI/:id', (req, res) => {
	getPokemonFromDexAPI(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/teamMember/:id', function (req, res) {
	getFriendlyPokemonFromPC(req.params.id, function(err, result) {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/teamMemberAPI/:id', function (req, res) {
	getPokemonFromPC(req.params.id, function(err, result) {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/pc/', function (req, res) {
	getPCBox(1, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
})

app.get('/pcAPI/', function (req, res) {
	getPCBoxAPI(1, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
})

app.get('/team/:id', function (req, res) {
	getTeamFromDB(req.params.id, function(err, result) {
		if (err) {
			res.send(err);
		}
		var team = {};
		team.team_name = result[0].team_name;
		for (var i = 1; i <= 6; i++) {
			//team.members[i] = new Promise((resolve, reject)).done
		}
		res.json(result[0]);
	})
})

app.get('/move/:id', (req, res) => {
	getMove(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/allowedMoves/:id', function (req, res) {
	getAllowedMoves(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
})

app.get('/ability/:id', (req, res) => {
	getAbility(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.get('/allowedAbilities/:id', (req, res) => {
	getAllowedAbilities(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
})

app.get('/item/:id', (req, res) => {
	getItem(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))