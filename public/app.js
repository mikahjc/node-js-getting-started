var app = angular.module('teambuilder', ['ngRoute', 'ui.router', 'ui.bootstrap']);

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

	.state('teams.add', {
		url: '/team/:id/slot/:num',
		templateUrl : 'pages/team_edit.html',
		controller  : 'TeamManagerController'
	})
})

app.controller('LoginController', function($scope) {
	$scope.message = 'Hello from LoginController'
});
app.controller('TeamsController', function($scope, $http, $state) {
	$scope.showForm = () => {
		var modalInstance = $modal.open({
			templateUrl: 'pages/modals/new_team.html',
			controller:  tbd,
			scope: $scope,
			resolve: {
				
			}
		})	
	}

	$http.get("/api/trainerTeams")
	.then(function(response) {
		if (response.data.succeed == false && response.data.reason == "not logged in") {
			$state.transitionTo('login');
			console.log(response.data);
		} else {
			$scope.teams = response.data;
		}
	});
});
app.controller('PCController', function($scope, $http, $state) {
   	$http.get("/api/pc")
   	.then(function(response) {
   		if (response.data.succeed == false && response.data.reason == "not logged in") {
   			$state.transitionTo('login');
   		} else {
   			$scope.pc = response.data;
   		}
   	});
});
app.controller('TeamDetailsController', function($scope, $stateParams, $http, $state, $rootScope) {
	$http.get("/api/team/" + $stateParams.id)
	.then(function(response) {
		if (response.data.succeed == false && response.data.reason == "not logged in") {
			$state.transitionTo('login');		
		} else {
			console.log(response.data);
			$rootScope.$broadcast('newTeam', response.data);
			$scope.team = response.data;
		}
	})
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
app.controller('TeamManagerController', function($scope, $stateParams, $http) {

});
app.controller('TeamModalController', function($scope, $modal) {

})