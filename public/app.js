var app = angular.module('teambuilder', ['ngRoute', 'ngAnimate', 'ui.router', 'angular.filter']);

function login() {
	var username = document.getElementById("login").username.value;
	var password = document.getElementById("login").password.value;
	$.post("/login", {username: username, password: password}, function(response) {
		if (response.succeed) {
			window.location.href = '/#!/teams'
		} else {
			alert("Login failed: \n" + response.toString())
			savedResponse = response;
		}
	});
}

function nameNewTeam() {
	$("#newTeamButton").hide();
	$("#newTeamInfo").show();
}

function cancelNewTeam() {
	$("#newTeamInfo").hide();
	$("#newTeamButton").show();
}

function addTeamMember(team_id, slot, id) {
	
}

function createNewTeam() {
	var newTeamName = $("#newTeamName").val();
	console.log(newTeamName);
	$.post("/api/team", { teamName: newTeamName }, (data) => {
		if (data.succeed) {
			console.log(data.result);
			var newTeamId = data.result.rows[0].id;
			window.location.href = "/#!/teamEdit/" + newTeamId + "/slot/1";
		} else {
			alert("Team creation failed:\n" + data.error);
			console.log(data);
		}
	})
}

function renameTeam(self) {
	var team = self.id;
	var team_id = self.id.substring(4)
	if (self.innerHTML == "Rename") {
		self.innerHTML = "Save";
		var label_width = $(self).position().left - $("#label_" + team).position().left - 15;
		$("#label_" + team).hide();
		$("#input_" + team).show();
		$("#input_" + team).width(label_width);
	} else if (self.innerHTML == "Save") {
		var data = { teamName: $("#input_" + team).val() };
		console.log(data)
		$.ajax({
			url: "/api/team/" + team_id,
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify({ teamName: $("#input_" + team).val() }),
			success: (data) => {
				if (data.succeed) {
					$("#label_" + team).text($("#input_" + team).val());
					self.innerHTML = "Rename";
					$("#label_" + team).show();
					$("#input_" + team).hide();
				} else if (data.reason == "not logged in") {
					window.location.href = '/#!';
				} else {
					alert("Unable to reaname team:\n" + data.reason);
				}
			},
			dataType: 'json'
		})
		
	}
}

function deleteTeam(self) {
	if (confirm("Are you sure you want to delete " + $("#label_team" + self.id.substring(3)).text() + "?\nYour team members will return to Bill's PC.")) {
		$.ajax({
			url: "/api/team/" + self.id.substring(3),
			type: 'DELETE',
			success: (data) => {
				if (data.succeed) {
					alert("Team deleted.");
					$("#container_team" + self.id.substring(3)).remove();
					window.location.href = "/#!/teams";
				} else {
					alert("Unable to delete team:\n" + data.reason);
					console.log(data);
				}
			}
		})
	}
}


app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/');

	$stateProvider

	.state('login', {
		url: '/',
		templateUrl : 'pages/login.html',
		controller  : 'LoginController'
	})

	.state('pc', {
		url: '/pc',
		templateUrl : 'pages/pc.html',
		controller  : 'PCController'
	})

	.state('pc.detail', {
		url: '/:id',
		views: {
			"details" : {
				templateUrl: 'pages/pc_detail.html',
				controller: 'PCDetailController'
			}
		}
	})

	.state('modal', {
		views:{"modal": {
			templateUrl: "pages/modal.html"
		}},
		abstract: true
	})

	.state('modal.getTeamName', {
		views:{"modal": {
			templateUrl: 'pages/modals/new_team.html'
		}}
	})

	.state('teams', {
		url: '/teams',
		templateUrl : 'pages/teams.html',
		controller  : 'TeamsController'
	})

	.state('teams.detail', {
		url: '/:id',
		views: { 
			"details" : {
				templateUrl: 'pages/team_details.html',
				controller : 'TeamDetailsController'
			},
			"summary" : {
				templateUrl: 'pages/team_summary.html',
				controller:  'TeamSummaryController'
			}
		}
	})

	.state('teamEdit', {
		url: '/teamEdit/:id',
		templateUrl : 'pages/team_edit.html',
		controller  : 'TeamManagerController'
	})

	.state('teamEdit.slot', {
		url: '/slot/:slot',
		views: {
			"mini-team" : {
				templateUrl: 'pages/mini_team.html'
			},
			"pc" : {
				templateUrl: 'pages/pc.html',
				controller : 'PCController'
			}
		}
	})

	.state('pokeDetail', {
		url: '/teamMember/:id',
		templateUrl: 'pages/poke_detail.html'
	})

	.state('pokeEdit', {
		url: '/pokeEdit/:id',
		templateUrl: 'pages/poke_edit.html',
		controller: 'PokeEditController'
	}) 
})

app.controller('LoginController', function($scope) {
	$scope.message = 'Hello from LoginController'
});

app.controller('PokeEditController', function($scope, $http, $state, $stateParams) {
	$scope.hp_iv  = 0;
	$scope.atk_iv = 0;
	$scope.def_iv = 0;
	$scope.spa_iv = 0;
	$scope.spd_iv = 0;
	$scope.spe_iv = 0;
	$scope.hp_ev  = 0;
	$scope.atk_ev = 0;
	$scope.def_ev = 0;
	$scope.spa_ev = 0;
	$scope.spd_ev = 0;
	$scope.spe_ev = 0;
	var movesReady = false;
	var itemsReady = false;
	var naturesReady = false;
	var abilitiesReady = false;

	$scope.$watch('pokedex', function() {
		if ($scope.pokedex[0].hasOwnProperty('id')) {
		console.log("pokedex loaded");
		if ($stateParams.id == null || $stateParams.id == "new") {
		$scope.newPokemon = true;
	} else {
		$http.get("/api/teamMember/" + $stateParams.id + "/raw")
		.then((response) => {
			if (response.data.hasOwnProperty('pokemon')) {
				var member = response.data;
				$scope.member = member;
				$scope.pokemon = $scope.pokedex.find(function(element) {
					return element.id == member.pokemon;
				});
				if (member.nickname != null) {
					$scope.nickname = member.nickname;
				}
				$scope.level = member.level;
				$scope.hp_iv  = member.hp_iv ;
				$scope.atk_iv = member.atk_iv;
				$scope.def_iv = member.def_iv;
				$scope.spa_iv = member.spa_iv;
				$scope.spd_iv = member.spd_iv;
				$scope.spe_iv = member.spe_iv;
				$scope.hp_ev  = member.hp_ev ;
				$scope.atk_ev = member.atk_ev;
				$scope.def_ev = member.def_ev;
				$scope.spa_ev = member.spa_ev;
				$scope.spd_ev = member.spd_ev;
				$scope.spe_ev = member.spe_ev;
				if (movesReady) {
					$scope.selectedMove1 = $scope.allowedMoves.find(function(element) {
						return element.id == member.move_1;
					})
					$scope.selectedMove2 = $scope.allowedMoves.find(function(element) {
						return element.id == member.move_2;
					})
					$scope.selectedMove3 = $scope.allowedMoves.find(function(element) {
						return element.id == member.move_3;
					})
					$scope.selectedMove4 = $scope.allowedMoves.find(function(element) {
						return element.id == member.move_4;
					})
				}
				if (itemsReady) {
					$scope.selectedItem = $scope.items.find(function(element) {
						return element.id == member.held_item;
					})
				}
				if (naturesReady) {
					$scope.selectedNature = Object.values($scope.items).find(function(element) {
						return element.id == member.nature;
					})
				}
				if (abilitiesReady) {
					$scope.selectedAbility = $scope.allowedAbilities.find(function(element) {
						return element.id == member.ability;
					})
				}
			} else {
				console.log("error retrieving team member");
			}
		})
	}}
	})

	$http.get("/api/item/all")
	.then(function(response) {
		if (response.data.succeed) {
			$scope.items = response.data.data;
			itemsReady = true;
			if ($scope.member != null && $scope.selectedItem == null) {
				$scope.selectedItem = $scope.items.find(function(element) {
						return element.id == $scope.member.held_item;
					})
			}
		} else {
			console.log("error getting items");
		}
	})

	$http.get("/api/nature/all")
	.then(function(response) {
		if (response.data.succeed) {
			$scope.natures = response.data.data;
			naturesReady = true;
			if ($scope.member != null && $scope.selectedNature == null) {
				$scope.selectedNature = Object.values($scope.items).find(function(element) {
						return element.id == member.nature;
				})
			}
		} else {
			console.log("error getting natures");
		}
	})

	$http.get("/api/pokemon/all")
	.then(function(response) {
		if (response.data.succeed) {
			$scope.pokedex = response.data.data;
		} else {
			console.log("error getting pokedex");
		}
	})

	$scope.$watch('pokemon', function () {
		$scope.getPokemon($scope.pokemon.id);
	})
	$scope.$watch('selectedMove1', function() {
		if ($scope.selectedMove1 == null) {
			$scope.selectedMove2 = null;
			$scope.selectedMove3 = null;
			$scope.selectedMove4 = null;
		}
	})
	$scope.$watch('selectedMove2', function() {
		if ($scope.selectedMove2 == null) {
			$scope.selectedMove3 = null;
			$scope.selectedMove4 = null;
		}
	})
	$scope.$watch('selectedMove3', function() {
		if ($scope.selectedMove3 == null) {
			$scope.selectedMove4 = null;
		}
	})

	$scope.savePokemon = () => {
		if ($scope.newPokemon) {
			createNewPokemon();
		} else {
			saveExistingPokemon();
		}
	}

	var createNewPokemon = () => {
		console.log("saving new pokemon");
		var data = {
			pokemon: $scope.pokemon.id,
			nickname: $scope.nickname,
			level: $scope.level,
			ability: $scope.selectedAbility.id,
			nature: $scope.selectedNature.id,
			held_item: $scope.selectedItem.id || null,
			move_1: $scope.selectedMove1.id,
			hp_iv:  $scope.hp_iv,
			atk_iv: $scope.atk_iv,
			def_iv: $scope.def_iv,
			spa_iv: $scope.spa_iv,
			spd_iv: $scope.spd_iv,
			spe_iv: $scope.spe_iv,
			hp_ev: $scope.hp_ev,
			atk_ev: $scope.atk_ev,
			def_ev: $scope.def_ev,
			spa_ev: $scope.spa_ev,
			spd_ev: $scope.spd_ev,
			spe_ev: $scope.spe_ev
		};
		if ($scope.selectedMove2 != null) {
			data.move_2 = $scope.selectedMove2.id;
		}
		if ($scope.selectedMove3 != null) {
			data.move_4 = $scope.selectedMove3.id;
		}
		if ($scope.selectedMove4 != null) {
			data.move_4 = $scope.selectedMove4.id;
		}
		console.log(data);
		$http.post("/api/teamMember", data)
		.then((response) => {
			if (response.data.succeed) {
				alert("Pokemon Saved");
				console.log(response.data);
			} else {
				alert("Unable to save Pokemon");
				console.log(response.data);
			}
		})
	}

	var saveExistingPokemon = () => {
		console.log("saving existing pokemon");
		var data = {
			pokemon: $scope.pokemon.id,
			nickname: $scope.nickname,
			level: $scope.level,
			ability: $scope.selectedAbility.id,
			nature: $scope.selectedNature.id,
			move_1: $scope.selectedMove1.id,
			hp_iv:  $scope.hp_iv,
			atk_iv: $scope.atk_iv,
			def_iv: $scope.def_iv,
			spa_iv: $scope.spa_iv,
			spd_iv: $scope.spd_iv,
			spe_iv: $scope.spe_iv,
			hp_ev: $scope.hp_ev,
			atk_ev: $scope.atk_ev,
			def_ev: $scope.def_ev,
			spa_ev: $scope.spa_ev,
			spd_ev: $scope.spd_ev,
			spe_ev: $scope.spe_ev
		};
		if ($scope.selectedMove2 != null) {
			data.move_2 = $scope.selectedMove2.id;
		}
		if ($scope.selectedMove3 != null) {
			data.move_4 = $scope.selectedMove3.id;
		}
		if ($scope.selectedMove4 != null) {
			data.move_4 = $scope.selectedMove4.id;
		}
		if ($scope.selectedItem != null) {
			data.held_item = $scope.selectedItem.id;
		}
		console.log(data);
		$http.put("/api/teamMember/" + $stateParams.id, data)
		.then((response) => {
			if (response.data.succeed) {
				alert("Pokemon Saved");
				console.log(response.data);
			} else {
				alert("Unable to save Pokemon");
				console.log(response.data);
			}
		})
	}

	$scope.getPokemon = (id) => {
		$http.get("/api/allowedMoves/" + id)
		.then(function(response) {
			if (response.data.length > 0) {
				$scope.allowedMoves = response.data;
				movesReady = true;
				if ($scope.member != null && $scope.selectedMove1 == null) {
					$scope.selectedMove1 = $scope.allowedMoves.find(function(element) {
						return element.id == $scope.member.move_1;
					})
					$scope.selectedMove2 = $scope.allowedMoves.find(function(element) {
						return element.id == $scope.member.move_2;
					})
					$scope.selectedMove3 = $scope.allowedMoves.find(function(element) {
						return element.id == $scope.member.move_3;
					})
					$scope.selectedMove4 = $scope.allowedMoves.find(function(element) {
						return element.id == $scope.member.move_4;
					})
				}
			} else {
				console.log("error getting allowed moves");
			}
		})
		$http.get("/api/allowedAbilities/" + id)
		.then(function(response) {
			if (response.data.length > 0) {
				$scope.allowedAbilities = response.data;
				abilitiesReady = true;
				if ($scope.member != null && $scope.selectedAbility == null) {
					$scope.selectedAbility = $scope.allowedAbilities.find(function(element) {
						return element.id == $scope.member.ability;
					})
				}
			}
		})
	}
})

app.controller('TeamsController', function($scope, $http, $state, $log) {
	$http.get("/api/trainerTeams")
	.then(function(response) {
		if (response.data.succeed == false && response.data.reason == "not logged in") {
			$state.transitionTo('login');
		} else {
			$scope.teams = response.data;
		}
	});
});
app.controller('PCController', function($scope, $http, $state, $stateParams, $rootScope) {
	$scope.addTeamMember = (id) => {
		var data = {};
		data['member_' + $stateParams.slot] = id;
		$http.put("/api/team/" + $stateParams.id,
		          data)
		.then((response) => {
			if (response.data.succeed) {
				$scope.loadTeam();
				//teamPCInterface.loadTeam($stateParams.id);
			} else if (response.data.reason == "not logged in") {
				$state.transitionTo('login');
			} else {
				alert("Unable to add to team:\n" + data.reason);
			}
		});
	};

	$scope.releaseTeamMember = (id) => {
		var teamMember = $scope.pc.find((element) => {
			return element.id == id;
		})
		if (teamMember == null) {
			alert("What are you trying to do?! That's not your Pokemon!");
			return;
		}
		var name = teamMember.nickname || teamMember.pokemon;
		if (!confirm("Are you sure you want to release " + name + "?\nThis action cannot be undone.")) {
			return;
		}
		$http.get("/api/teamMember/" + id + "/isOnTeams")
		.then((response) => {
			if (!response.data.succeed) {
				$http.delete("/api/teamMember/" + id)
				.then((response) => {
					if (response.data.succeed) {
						alert(name + " was released. Bye " + name + "!");
						loadPC();
					} else if (response.data.reason == "team member is still engaged") {
						alert("This is embarrasing... we forgot to tell you that " + name + " is still on a team!\nRemove it from all of your teams first.");
					} else {
						alert("We couldn't release " + name + " for some reason... maybe it's too attached to you?");
						console.log(response.data);
					}
				})
			} else {
				// Is on teams, can't release
				var alertString = "You can't release " + name + "! Remove it from these teams first:\n";
				for (let team in response.data.teams) {
					alertString += team.team_name + "\n";
				}
				alert(alertString)
			}
		})
	}

	if ($stateParams.hasOwnProperty('slot')) {
		$scope.slot = $stateParams.slot;
	} else {
		loadPC();
	}
	
	function loadPC() {
		$http.get("/api/pc")
   		.then(function(response) {
   			if (response.data.succeed == false && response.data.reason == "not logged in") {
   				$state.transitionTo('login');
   			} else {
   				$scope.pc = response.data;
   			}
   		});
	}
});
app.controller('PCDetailController', function($scope, $stateParams, $http) {
	console.log("Spinning up details");
	$http.get("/api/teamMember/" + $stateParams.id)
	.then((response) => {
		if (!response.data.hasOwnProperty('pokemon')) {
			console.log(response);
			console.log("error getting PC details");
		} else {
			$scope.detailedPokemon = response.data;
			$http.get("/api/nature/" + response.data.nature)
			.then((response) => {
				if (response.data != null) {
					$scope.nature = response.data;
				} else {
					console.log("error retrieving nature");
				}
			})
		}
	})

	$http.get("/api/teamMember/" + $stateParams.id + "/raw")
	.then((response) => {
		if (!response.data.hasOwnProperty('pokemon')) {
			console.log(response);
			console.log("error getting PC raw details");
		} else {
			if (response.data.held_item != null) {
				$http.get("/api/item/" + response.data.held_item)
				.then((response) => {
					if (response.data != null) {
						$scope.item = response.data;
					} else {
						console.log("error retrieving item");
					}
				})
			} else {
				$scope.item = null;
			}
			$http.get("/api/ability/" + response.data.ability)
			.then((response) => {
				if (response.data != null) {
					$scope.ability = response.data;
				} else {
					console.log("error retrieving ability");
				}
			})
			$http.get("/api/move/" + response.data.move_1)
			.then((response) => {
				if (response.data != null) {
					$scope.move1 = response.data;
				} else {
					console.log("error retrieving move 1");
				}
			})
			if (response.data.move_2 != null) {
				$http.get("/api/move/" + response.data.move_2)
				.then((response) => {
					if (response.data != null) {
						$scope.move2 = response.data;
					} else {
						console.log("error retrieving move 2");
					}
				})
			} else {
				$scope.move2 = null;
			}
			if (response.data.move_3 != null) {
				$http.get("/api/move/" + response.data.move_3)
				.then((response) => {
					if (response.data != null) {
						$scope.move3 = response.data;
					} else {
						console.log("error retrieving move 3");
					}
				})
			} else {
				$scope.move3 = null;
			}
			if (response.data.move_4 != null) {
				$http.get("/api/move/" + response.data.move_4)
				.then((response) => {
					if (response.data != null) {
						$scope.move4 = response.data;
					} else {
						console.log("error retrieving move 4");
					}
				})
			} else {
				$scope.move4 = null;
			}
		}
	})
})
app.controller('TeamDetailsController', function($scope, $stateParams, $http, $state, $rootScope) {
	$scope.removeTeamMember = (slot) => {
		console.log(slot);
		console.log($scope.team.members);
		var name = $scope.team.members[slot].nickname || $scope.team.members[slot].pokemon;
		if (confirm("Are you sure you want to remove " + name + " from " + $scope.team.team_name + "?")) {
			var data = {};
			data["member_" + (slot + 1)] = null;
			console.log(data);
			$http.put("/api/team/" + $stateParams.id, data)
			.then((response) => {
				console.log(response);
				if (response.data.succeed) {
					getTeam();
				} else if (response.data.reason == "not logged in") {
					$state.transitionTo('login');
				} else {
					alert("Unable to add to team:\n" + data.reason);
				}
			})
		}
	}

	function getTeam() {
		$http.get("/api/team/" + $stateParams.id)
		.then(function(response) {
			if (response.data.succeed == false && response.data.reason == "not logged in") {
				$state.transitionTo('login');		
			} else {
				console.log(response.data);
				$rootScope.$broadcast('newTeam', response.data);
				$scope.team = response.data;
			}
		});
	}
	getTeam();
});
app.controller('TeamSummaryController', function($scope, $stateParams, $http) {
	$scope.$on('newTeam', (event, msg) => {
		console.log("Team received");
		console.log(msg);
		var hp = 0
		,   atk = 0
		,   def = 0
		,   spa = 0
		,   spd = 0
		,   spe = 0
		,   members = 0;
		for (let member of msg.members) {
			if (member != null) {
				members++;
				hp += member.base_hp;
				atk += member.base_attack;
				def += member.base_defense;
				spa += member.base_special_attack;
				spd += member.base_special_defense;
				spe += member.base_speed;
			}
		}
		$scope.avg_hp = Math.round(hp / members);
		$scope.avg_atk = Math.round(atk / members);
		$scope.avg_def = Math.round(def / members);
		$scope.avg_spa = Math.round(spa / members);
		$scope.avg_spd = Math.round(spd / members);
		$scope.avg_spe = Math.round(spe / members);
	})
});
app.controller('TeamManagerController', function($scope, $stateParams, $http, $state) {
	$scope.team = {};
	$scope.pc = {};

	$scope.loadTeam = () => {
		console.log("loading team from parent");
		$http.get("/api/team/" + $stateParams.id)
	.then(function(response) {
		if (response.data.succeed == false && response.data.reason == "not logged in") {
			$state.transitionTo('login');
			console.log(response.data);
		} else {
			$scope.team = response.data;
		}
	});
	}

	$http.get("/api/pc")
   		.then(function(response) {
   			if (response.data.succeed == false && response.data.reason == "not logged in") {
   				$state.transitionTo('login');
   			} else {
   				$scope.pc = response.data;
   			}
   		});

	$scope.loadTeam();
});
