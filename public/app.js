var app = angular.module('teambuilder', ['ngRoute', 'ui.router']);

function login() {
	var username = document.getElementById("login").username.value;
	var password = document.getElementById("login").password.value;
	$.post("/login", {username: username, password: password}, function(response) {
		if (response.succeed) {
			window.location.href = '/#!/teams'
		}
	});
}

app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/home');

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

	.state('teams', {
		url: '/teams',
		templateUrl : 'pages/teams.html',
		controller  : 'TeamsController'
	})

	.state('teams.detail', {
		url: '/:id',
		templateUrl: 'pages/team_details.html',
		controller : function($scope, $stateParams, $http) {
			$http.get("/api/team/" + $stateParams.id)
			.then(function(response) {
				$scope.team = response.data;
			})
		}
	})
})

app.controller('LoginController', function($scope) {
	$scope.message = 'Hello from LoginController'
});
app.controller('TeamsController', function($scope, $http) {
	$http.get("/api/trainerTeams")
	.then(function(response) {
		$scope.teams = response.data;
	});
});
app.controller('PCController', function($scope, $http) {
   	$http.get("/api/pc")
   	.then(function(response) {
   		$scope.pc = response.data;
   	});
});