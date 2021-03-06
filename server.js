const express = require('express');
const path = require('path');
const Promise = require('promise');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const async = require('async');
// sqlCredentials is a module that provides:
// PG username
// hostname
// PG database name
// PG password
// It will not be provided in this repo.
const sqlCreds = require('./sqlCredentials.js');
var natures = {};
var typeMatchups = {};

const pool = new Pool({
	user: sqlCreds.user,
	host: sqlCreds.host,
	database: sqlCreds.database,
	password: sqlCreds.password,
	port: process.env.SQLPORT || 5432
})

function doQuery(sql, params, callback) {
	pool.query(sql, params, function(err, result) {
		if (err) {
			console.log("DB error!");
			console.log(err);
			callback(err, null);
		}

		callback(null, result.rows);
	})}

function verifyLogin(req, res, next) {
  if(!req.session.hasOwnProperty('userid')) {
    res.json({succeed: false, reason: "not logged in"});
  } else {
    next()
  }
}

function getBaseStatsFromName(id, callback) {
	var sql = 'SELECT base_hp, base_attack, base_defense, base_special_attack, base_special_defense, base_speed FROM pokemon WHERE name=$1::text';
	var params = [id];

	doQuery(sql, params, callback);
}

function getPokemonFromDex(id, callback) {
	var sql = 'SELECT pv.name, pv.number, pv.type1, pv.type2, pv.previous_evolution, pv.base_hp, pv.base_attack, pv.base_defense, pv.base_special_attack, pv.base_special_defense, pv.base_speed FROM pokemon_view pv WHERE pv.id = $1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getPokemonFromDexAPI(id, callback) {
	var sql = 'SELECT name, number, type1, type2, previous, base_hp, base_attack, base_defense, base_special_attack, base_special_defense, base_speed, gen FROM pokemon WHERE id = $1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getFriendlyPokemonFromPC(id, owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members_view WHERE id=$1::int and trainer_name=(SELECT trainer_name FROM users WHERE id=$2::int);';
	var params = [id, owner];

	doQuery(sql, params, callback);}
function getPokemonFromPC(id, owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members WHERE id=$1::int and owner=$2::int;';
	var params = [id, owner];

	doQuery(sql, params, callback);}
function getTeamFromDB(id, callback) {
	var sql = 'SELECT team_name, member_1, member_2, member_3, member_4, member_5, member_6 FROM teams WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getAllowedMoves(pokemonId, callback) {
	var sql = 'SELECT am.move as id, m.name as name, t.name as type, m.category, m.power, m.accuracy, m.pp, m.description, am.how_learned, am.learned_at FROM allowed_moves am LEFT JOIN moves m ON am.move = m.id LEFT JOIN types t ON m.type = t.id WHERE pokemon=$1::int';
	var params = [pokemonId];

	doQuery(sql, params, callback);}
function getAllowedAbilities(pokemonId, callback) {
	var sql = 'SELECT ab.ability as id, a.name, ab.hidden, a.description FROM allowed_abilities ab LEFT JOIN abilities a ON ab.ability = a.id WHERE pokemon=$1::int';
	var params = [pokemonId];

	doQuery(sql, params, callback);}
function getAbility(id, callback) {
	var sql = 'SELECT name, description FROM abilities WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getMove(id, callback) {
	var sql = 'SELECT m.name, t.name as type, category, power, accuracy, pp, description FROM moves m JOIN types t ON m.type = t.id WHERE m.id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getItem(id, callback) {
	var sql = 'SELECT name, description FROM items WHERE id=$1::int';
	var params = [id];

	doQuery(sql, params, callback);}
function getPCBox(owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members_view WHERE trainer_name=(SELECT trainer_name FROM users WHERE id=$1::int) ORDER BY id';
	var params = [owner];

	doQuery(sql, params, callback);}
function getPCBoxAPI(owner, callback) {
	var sql = 'SELECT id, pokemon, nickname, level, ability, nature, held_item, move_1, move_2, move_3, move_4, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv, hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev FROM team_members WHERE owner=$1::int ORDER BY id';
	var params = [owner];

	doQuery(sql, params, callback);}
function getTeams(owner, callback) {
	var sql = 'SELECT id, team_name FROM teams WHERE owner=$1::int';
	var params = [owner];

	doQuery(sql, params, callback);}

function getAllItems(callback) {
	var sql = 'SELECT id, name, description FROM items';
	var params = [];

	doQuery(sql, params, callback);
}

function getPokedex(callback) {
	var sql = 'SELECT p.id, p.name, t1.name as type1, t2.name as type2, previous, base_hp, base_attack, base_defense, base_special_attack, base_special_defense, base_speed, gen FROM pokemon p LEFT JOIN types t1 ON p.type1 = t1.id LEFT JOIN types t2 ON p.type2 = t2.id ORDER BY p.id';
	var params = [];

	doQuery(sql, params, callback);
}

function isLoggedIn(request) {
  return request.session.hasOwnProperty('userid');
}

// Server Setup

function calcHP(base, iv, ev, level) {
	var stat = Math.floor(((2 * base + iv + Math.floor(ev/4)) * level)/100) + level + 10;
	return stat;
}

function calcStat(base, iv, ev, level, nature, stat) {
	if (natures[nature].boosted == natures[nature].weakened) {
		var natureMult = 1;
	} else if (natures[nature].boosted == stat) {
		var natureMult = 1.1;
	} else if (natures[nature].weakened == stat) {
		var natureMult = 0.9;
	} else {
		var natureMult = 1;
	}
	var evStat = Math.floor(ev/4);
	var innerStat = Math.floor(((2*base + iv + evStat) * level) / 100) + 5
	var stat = Math.floor(innerStat * natureMult);
	return stat;
}

var app = express();
app.use(express.json())
   .use(bodyParser.urlencoded({ extended: true }))
   .use(express.static(path.join(__dirname, 'public')))
   .use(session({
	cookieName: 'session',
	secret: 'GlTZmOhfdg9PUx11S1tv3ynCg2gfWb9SdfsyB2OfWzXzUeBUkklS4HsjvgtZm3n',
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
	httpOnly: true,
	ephemeral: true
}))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'));

app.get('/api/pc/', verifyLogin, (req, res) => {
	getPCBox(req.session.userid, (err, result) => {
		if (err) {
			res.send(err);
			return;
		}
		async.forEachOf(result, (value, key, callback) => {
					if (value != null) {
					getBaseStatsFromName(value.pokemon, (err, result2) => {
						if (err) {
							return callback(err);
						} else {
							member = result[key];
							result[key].calc_hp              = calcHP(result2[0].base_hp, member.hp_iv, member.hp_ev, member.level);
							result[key].calc_attack          = calcStat(result2[0].base_attack, member.atk_iv, member.atk_ev, member.level, member.nature, "atk");
							result[key].calc_defense         = calcStat(result2[0].base_defense, member.def_iv, member.def_ev, member.level, member.nature, "def");
							result[key].calc_special_attack  = calcStat(result2[0].base_special_attack, member.spa_iv, member.spa_ev, member.level, member.nature, "spa");
							result[key].calc_special_defense = calcStat(result2[0].base_special_defense, member.spd_iv, member.spd_ev, member.level, member.nature, "spd");
							result[key].calc_speed           = calcStat(result2[0].base_speed, member.spe_iv, member.spe_ev, member.level, member.nature, "spe");
							callback();
						}
					})
					} else {
						callback();
					}
				}, (err) => {
					if (err) {
						res.json({succeed: false, reason: {error: err}});
					} else {
						res.json(result);
					}
				});

		})
}).get('/api/pc/raw', verifyLogin, (req, res) => {
	getPCBoxAPI(req.session.userid, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
}).get('/api/team/:id', verifyLogin, (req, res) => {
	getTeamFromDB(req.params.id, function(err, result) {
		if (err) {
			res.send(err);
		}
		var team = {};
		team.id = req.params.id;
		team.team_name = result[0].team_name;
		team.members = [ {slot: 1, id: result[0].member_1},
						 {slot: 2, id: result[0].member_2},
						 {slot: 3, id: result[0].member_3},
						 {slot: 4, id: result[0].member_4},
						 {slot: 5, id: result[0].member_5},
						 {slot: 6, id: result[0].member_6} ];
		async.forEachOf(team.members, (value, key, callback) => {
				getFriendlyPokemonFromPC(value.id, req.session.userid, (err, result) => {
					if (err) {
						return callback(err);
					} else {
						team.members[key] = result[0];
						callback();
					}
				});
		}, (err) => {
			if (err) {
				res.json({succeed: false, reason: {error: err}});
			} else {
				async.forEachOf(team.members, (value, key, callback) => {
					if (value != null) {
					getBaseStatsFromName(value.pokemon, (err, result) => {
						if (err) {
							return callback(err);
						} else {
							member = team.members[key];
							team.members[key].base_hp              = result[0].base_hp;
							team.members[key].base_attack          = result[0].base_attack;         
							team.members[key].base_defense         = result[0].base_defense;  
							team.members[key].base_special_attack  = result[0].base_special_attack; 
							team.members[key].base_special_defense = result[0].base_special_defense; 
							team.members[key].base_speed           = result[0].base_speed;
							team.members[key].calc_hp              = calcHP(result[0].base_hp, member.hp_iv, member.hp_ev, member.level);
							team.members[key].calc_attack          = calcStat(result[0].base_attack, member.atk_iv, member.atk_ev, member.level, member.nature, "atk");
							team.members[key].calc_defense         = calcStat(result[0].base_defense, member.def_iv, member.def_ev, member.level, member.nature, "def");
							team.members[key].calc_special_attack  = calcStat(result[0].base_special_attack, member.spa_iv, member.spa_ev, member.level, member.nature, "spa");
							team.members[key].calc_special_defense = calcStat(result[0].base_special_defense, member.spd_iv, member.spd_ev, member.level, member.nature, "spd");
							team.members[key].calc_speed           = calcStat(result[0].base_speed, member.spe_iv, member.spe_ev, member.level, member.nature, "spe");
							callback();
						}
					})
					} else {
						callback();
					}
				}, (err) => {
					if (err) {
						res.json({succeed: false, reason: {error: err}});
					} else {
						res.json(team);
					}
				})
			}
		});
	})
}).get('/api/move/:id', (req, res) => {
	getMove(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
}).get('/api/item/:id', (req, res) => {
	if (req.params.id == "all") {
		getAllItems((err, result) => {
			if (err) {
				res.json({succeed: false, reason: {error: err}});
			} else {
				res.json({succeed: true, data: result})
			}
		})
	} else {
		getItem(req.params.id, (err, result) => {
			if (err) {
				res.send(err);
			} else {
				res.json(result[0]);
			}
		})
	}
}).get('/api/ability/:id', (req, res) => {
	getAbility(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
}).get('/api/pokemon/:id', (req, res) => {
	if (req.params.id == "all") {
		getPokedex((err, result) => {
			if (err) {
				res.json({succeed: false, reason: {error: err}});
			} else {
				res.json({succeed: true, data: result});
			}
		})
	} else {
		getPokemonFromDex(req.params.id, (err, result) => {
			if (err) {
				res.send(err);
			}
			if (result.length > 0) {
				res.json(result[0]);
			} else {
				res.send("No data");
			}
		})}
}).get('/api/pokemon/:id/raw', (req, res) => {
	getPokemonFromDexAPI(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
}).get('/api/trainerTeams/', verifyLogin, (req, res) => {
	getTeams(req.session.userid, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
}).get('/api/teamMember/:id', verifyLogin, (req, res) => {
	getFriendlyPokemonFromPC(req.params.id, req.session.userid, function(err, result) {
		if (err) {
			res.send(err);
		} else if (result === undefined || result.length == 0) {
			res.json({succeed: false, reason: "does not exist"});
		} else {
		getBaseStatsFromName(result[0].pokemon, (err, result2) => {
						if (err) {
							res.send({succeed: false, reason: {error: err}});
						} else {
							var member = result[0];
							result[0].base_hp              = result2[0].base_hp;
							result[0].base_attack          = result2[0].base_attack;         
							result[0].base_defense         = result2[0].base_defense;  
							result[0].base_special_attack  = result2[0].base_special_attack; 
							result[0].base_special_defense = result2[0].base_special_defense; 
							result[0].base_speed           = result2[0].base_speed;
							result[0].calc_hp              = calcHP(result2[0].base_hp, member.hp_iv, member.hp_ev, member.level);
							result[0].calc_attack          = calcStat(result2[0].base_attack, member.atk_iv, member.atk_ev, member.level, member.nature, "atk");
							result[0].calc_defense         = calcStat(result2[0].base_defense, member.def_iv, member.def_ev, member.level, member.nature, "def");
							result[0].calc_special_attack  = calcStat(result2[0].base_special_attack, member.spa_iv, member.spa_ev, member.level, member.nature, "spa");
							result[0].calc_special_defense = calcStat(result2[0].base_special_defense, member.spd_iv, member.spd_ev, member.level, member.nature, "spd");
							result[0].calc_speed           = calcStat(result2[0].base_speed, member.spe_iv, member.spe_ev, member.level, member.nature, "spe");
							res.json(result[0]);
						}
					})
		}
	})
}).get('/api/teamMember/:id/raw', verifyLogin, (req, res) => {
	getPokemonFromPC(req.params.id, req.session.userid, function(err, result) {
		if (err) {
			res.send(err);
		}
		res.json(result[0]);
	})
}).get('/api/teamMember/:id/isOnTeams', verifyLogin, (req, res) => {
	var sql = "SELECT team_name FROM teams WHERE member_1=$1::int OR member_2=$1::int OR member_3=$1::int OR member_4=$1::int OR member_5=$1::int OR member_6=$1::int AND owner=$2::int";
	var params = [req.params.id, req.session.userid];
	pool.query(sql, params, (err, result) => {
		if (err) {
			res.json({succeed: true, error: err});
		} else {
			if (result.rows.length > 0) {
				res.json({succeed: true, teams: result.rows});
			} else {
				res.json({succeed: false});
			}
		}
	})
}).get('/api/allowedMoves/:id', (req, res) => {
	getAllowedMoves(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
}).get('/api/allowedAbilities/:id', (req, res) => {
	getAllowedAbilities(req.params.id, (err, result) => {
		if (err) {
			res.send(err);
		}
		res.json(result);
	})
}).get('/api/nature/:nature', (req, res) => {
	if (req.params.nature == "all") {
		res.json({succeed: true, data: natures});
	} else {
		if (natures.hasOwnProperty(req.params.nature)) {
			res.json(natures[req.params.nature]);
		} else {
			res.json({succeed: false, reason: "nature does not exist"});
		}
	}
});

// What can be modified:
// team
// teamMember
app.post('/api/team/', verifyLogin, (req, res) => {
	var teamName = req.body.teamName;
	var sql = "SELECT team_name FROM teams WHERE team_name = $1::text and owner = $2::int";
	var params = [teamName, parseInt(req.session.userid)];
	pool.query(sql, params, (err, result) => {
		if (err) {
			res.json({succeed: false, reason: {error: err}});
		} else if (result.rows.length > 0) {
			res.json({succeed: false, reason: "exists"});
		} else {
			var sql = "INSERT INTO teams(team_name, owner) VALUES ($1::text, $2::int) RETURNING id";
			var params = [teamName, req.session.userid];
			pool.query(sql, params, (err, result) => {
				if (err) {
					res.json({succeed: false, error: err});
				} else {
					res.json({succeed: true, result: result});
				}
			})
		}
	})
}).post('/api/teamMember/', verifyLogin, (req, res) => {
	var sql = "INSERT INTO team_members(pokemon,nickname,level,  owner,  ability,nature, held_item,move_1, move_2, move_3,  move_4,  hp_iv,   atk_iv,  def_iv,  spa_iv,  spd_iv,  spe_iv,  hp_ev,   atk_ev,  def_ev,  spa_ev,  spd_ev,  spe_ev)\n"
	sql                     += "VALUES ($1::int,$2::text,$3::int,$4::int,$5::int,$6::int,$7::int,  $8::int,$9::int,$10::int,$11::int,$12::int,$13::int,$14::int,$15::int,$16::int,$17::int,$18::int,$19::int,$20::int,$21::int,$22::int,$23::int)";
	var params = [parseInt(req.body.pokemon),
				  req.body.nickname || null,
				  req.body.level ? parseInt(req.body.level) : null,
				  parseInt(req.session.userid),
				  parseInt(req.body.ability),
				  parseInt(req.body.nature),
				  req.body.held_item ? parseInt(req.body.held_item) : null,
				  parseInt(req.body.move_1),
				  req.body.move_2 ? parseInt(req.body.move_2) : null,
				  req.body.move_3 ? parseInt(req.body.move_3) : null,
				  req.body.move_4 ? parseInt(req.body.move_4) : null,
				  parseInt(req.body.hp_iv),
				  parseInt(req.body.atk_iv),
				  parseInt(req.body.def_iv),
				  parseInt(req.body.spa_iv),
				  parseInt(req.body.spd_iv),
				  parseInt(req.body.spe_iv),
				  parseInt(req.body.hp_ev),
				  parseInt(req.body.atk_ev),
				  parseInt(req.body.def_ev),
				  parseInt(req.body.spa_ev),
				  parseInt(req.body.spd_ev),
				  parseInt(req.body.spe_ev)];
	if (isNaN(params[0])||isNaN(params[4])||isNaN(params[5])||isNaN(params[7])||isNaN(params[11])||isNaN(params[12])||isNaN(params[13])||isNaN(params[14])||isNaN(params[15])||isNaN(params[16])||isNaN(params[17])||isNaN(params[18])||isNaN(params[19])||isNaN(params[20])||isNaN(params[21])||isNaN(params[22])) {
		res.json({succeed: false, reason: "missing data"});
	} else {
		pool.query(sql, params, (err, result) => {
			if (err) {
				res.json({succeed: false, reason: {error: err}});
			} else {
				res.json({succeed: true, data: result});
			}
		})
	}
}).post('/login', (req, res) => {
	var username = req.body.username;
	var password = req.body.password;
	var sql = "SELECT id FROM users WHERE email=$1::text AND password=$2::text";
	var params = [username, password];
	pool.query(sql, params, (err, result) => {
		if (err) {
			res.json(err)
		} else if (result.rows.length > 0) {
			req.session.userid = result.rows[0].id;
			res.json({succeed: true});
		} else {
			res.json({succeed: false});
		}
	})
});

app.put('/api/team/:id', verifyLogin, (req, res) => {
	var sql = "UPDATE teams SET ";
	var valid = false;
	var variableCounter = 1;
	for (var i = 1; i < 7; i++) {
		if (req.body.hasOwnProperty('member_' + i)) {
			if (i > 1 && valid) {
				sql += ", ";
			}
			if (req.body["member_" + i] == null) {
				sql += "member_" + i + "= null ";
			} else {
				sql += "member_" + i + "=(SELECT id from team_members where id=$" + variableCounter++ + "::int and owner=" + req.session.userid + ") ";
			}
			valid = true;
		}
	}
	if (req.body.hasOwnProperty('teamName')) {
		if (valid) {
			sql += ", ";
		}
		sql += "team_name=$" + variableCounter++ + "::text "
		valid = true;
	}
	sql += "WHERE id=$" + variableCounter++ +"::int AND owner=$"+ variableCounter++ +"::int";
	if (valid) {
		params = [...(req.body.member_1 ? [parseInt(req.body.member_1)] : []),
		          ...(req.body.member_2 ? [parseInt(req.body.member_2)] : []),
		          ...(req.body.member_3 ? [parseInt(req.body.member_3)] : []),
		          ...(req.body.member_4 ? [parseInt(req.body.member_4)] : []),
		          ...(req.body.member_5 ? [parseInt(req.body.member_5)] : []),
		          ...(req.body.member_6 ? [parseInt(req.body.member_6)] : []),
		          ...(req.body.teamName ? [req.body.teamName] : []),
		          parseInt(req.params.id),
		          parseInt(req.session.userid)];
		pool.query(sql, params, (err, result) => {
			if (err) {
				res.json({succeed: false, reason: {error: err}});
			} else {
				if (result.rowCount == 0) {
					res.json({succeed: false, reason: "team does not exist"});
				} else {
					res.json({succeed: true, result: result});
				}
			}
		});
	} else {
		res.json({succeed: false, reason: "no parameters provided"});
	}
}).put('/api/teamMember/:id', verifyLogin, (req, res) => {
	var sql = "UPDATE team_members SET ";
	var valid = true;
	var variableCounter = 1;

	// function appendSql(property, type) {
	// 	if (req.body.hasOwnProperty(property)) {
	// 		if (valid) {
	// 			sql += ", ";
	// 		} else {
	// 			valid = true;
	// 		}
	// 		sql += property + "=$" + variableCounter++ + "::" + type + " ";
	// 	}
	// }

	// appendSql('nickname', 'text')
	// appendSql('level', 'int');
	// appendSql('ability', 'int');
	// appendSql('nature', 'int');
	// appendSql('held_item', 'int');
	// for (var i = 1; i <= 4; i++) {
	// 	if (req.body.hasOwnProperty('move_' + i)) {
	// 		if (i > 1 || valid) {
	// 			sql += ", ";
	// 		}
	// 		sql += "move_" + i + "=$" + variableCounter++ + "::int ";
	// 		valid = true;
	// 	}
	// }
	// appendSql( 'hp_iv','int');
	// appendSql('atk_iv','int');
	// appendSql('def_iv','int');
	// appendSql('spa_iv','int');
	// appendSql('spd_iv','int');
	// appendSql('spe_iv','int');
	// appendSql( 'hp_ev','int');
	// appendSql('atk_ev','int');
	// appendSql('def_ev','int');
	// appendSql('spa_ev','int');
	// appendSql('spd_ev','int');
	// appendSql('spe_ev','int');
	sql = "UPDATE team_members SET nickname=$1, level=$2::int, ability=$3::int, nature=$4, held_item=$5::int, move_1=$6::int, move_2=$7::int, move_3=$8, move_4=$9, hp_iv=$10::int,atk_iv=$11::int,def_iv=$12::int,spa_iv=$13::int,spd_iv=$14::int,spe_iv=$15::int,hp_ev=$16::int,atk_ev=$17::int,def_ev=$18::int,spa_ev=$19::int,spd_ev=$20::int,spe_ev=$21::int\n";
	sql += "WHERE id=$22::int AND owner=$23::int";
	if (valid) {
		console.log(sql);
		params = [req.body.nickname ? req.body.nickname : null,
				  req.body.level ? parseInt(req.body.level) : null,
				  req.body.ability ? parseInt(req.body.ability) : null,
				  req.body.nature ? parseInt(req.body.nature) : null,
				  req.body.held_item ? parseInt(req.body.held_item) : null,
				  req.body.move_1 ? parseInt(req.body.move_1) : null,
				  req.body.move_2 ? parseInt(req.body.move_2) : null,
				  req.body.move_3 ? parseInt(req.body.move_3) : null,
				  req.body.move_4 ? parseInt(req.body.move_4) : null,
				  req.body.hp_iv || req.body.hp_iv == 0 ? parseInt(req.body.hp_iv) : null,
				  req.body.atk_iv || req.body.atk_iv == 0 ? parseInt(req.body.atk_iv) : null,
				  req.body.def_iv || req.body.def_iv == 0 ? parseInt(req.body.def_iv) : null,
				  req.body.spa_iv || req.body.spa_iv == 0 ? parseInt(req.body.spa_iv) : null,
				  req.body.spd_iv || req.body.spd_iv == 0 ? parseInt(req.body.spd_iv) : null,
				  req.body.spe_iv || req.body.spe_iv == 0 ? parseInt(req.body.spe_iv) : null,
				  req.body.hp_ev || req.body.hp_ev == 0 ? parseInt(req.body.hp_ev) : null,
				  req.body.atk_ev || req.body.atk_ev == 0 ? parseInt(req.body.atk_ev) : null,
				  req.body.def_ev || req.body.def_ev == 0 ? parseInt(req.body.def_ev) : null,
				  req.body.spa_ev || req.body.spa_ev == 0 ? parseInt(req.body.spa_ev) : null,
				  req.body.spd_ev || req.body.spd_ev == 0 ? parseInt(req.body.spd_ev) : null,
				  req.body.spe_ev || req.body.spe_ev == 0 ? parseInt(req.body.spe_ev) : null,
				  parseInt(req.params.id),
				  parseInt(req.session.userid)];
		console.log(params);
		pool.query(sql, params, (err, result) => {
			if (err) {
				res.json({succeed: false, reason: {error: err, query: sql, parameters: params}});
			} else {
				if (result.rowCount == 0) {
					res.json({succeed: false, reason: "team member does not exist"});
				} else {
					res.json({succeed: true, result: result});
				}
			}
		});
	} else {
		res.json({succeed: false, reason: "no parameters provided"});
	}
});

app.delete('/api/team/:id', verifyLogin, (req, res) => {
	var sql = "DELETE FROM teams WHERE id=$1::int and owner=$2::int";
	var params = [req.params.id, req.session.userid];
	pool.query(sql, params, (err, result) => {
		if (err) {
			res.json({succeed: false, reason: {error: err}});
		} else {
			if (result.rowCount == 0) {
				res.json({succeed: false, reason: "team does not exist"});
			} else {
				res.json({succeed: true, result: result});
			}
		}
	});
}).delete('/api/teamMember/:id', verifyLogin, (req, res) => {
	var sql = "DELETE FROM team_members WHERE id=$1::int and owner=$2::int";
	var params = [req.params.id, req.session.userid];
	pool.query(sql, params, (err, result) => {
		if (err) {
			if (err.code='23503') {
				res.json({succeed: false, reason: "team member is still engaged"})
			} else {
				res.json({succeed: false, reason: {error: err}});
			}
		} else {
			if (result.rowCount == 0) {
				res.json({succeed: false, reason: "team member does not exist"});
			} else {
				res.json({succeed: true, result: result});
			}
		}
	});
})

doQuery("SELECT name, boosted, weakened, id FROM natures",[], (err, result) => {
	for (let nature of result) {
		natures[nature.name] = {boosted: nature.boosted, weakened: nature.weakened, id: nature.id, name: nature.name};
	}
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }\nSQL pool connection on port ${ process.env.SQLPORT || 5432 }`))
