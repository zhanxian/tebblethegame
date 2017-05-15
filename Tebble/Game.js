import React, { Component } from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Modal, AsyncStorage} from 'react-native';
import Grid from './Grid';
import Start from './Start';
import GameOver from './GameOver';
import Pause from './Pause';
import Leaderboard from './Leaderboard';
import * as firebase from 'firebase';

export class Game extends Component {
    constructor(props){
          super(props);
          this.state = {
              start : true,
              gameOver: false,
              highscore: 0,
              score: 0,
              name: 'Tebbler',
              paused: false,
              leaderboard: false
          }

        //initialize firebase
          var config = {
            apiKey: "AIzaSyApDh39qPWTvfH92eEq79agpv5fyTsjcMI",
            authDomain: "tebble-15923.firebaseapp.com",
            databaseURL: "https://tebble-15923.firebaseio.com",
            projectId: "tebble-15923",
            storageBucket: "tebble-15923.appspot.com",
            messagingSenderId: "347709083033"
          };
          firebase.initializeApp(config);
          this.leaderboardDatabase = firebase.database();
          this.grid = undefined;
          this.topTenNames = [];
          this.topTenScores = [];
    }
    //sets up local highscore and firebase highscores
    componentDidMount(){
        var item = AsyncStorage.getItem("Local_highscore");
        item.then((hsStr)=>{
            if (hsStr !== undefined && hsStr !== null) {
                if (hsStr == 'NaN'){
                    hsStr = '0';
                }
                var hsInt = parseInt(hsStr);
                this.setState({highscore: hsInt});
            }
        });
        AsyncStorage.getItem("local_name").then((nameStr)=>{
            if (nameStr !== undefined && nameStr !== null) {
                this.setState({name: nameStr})
            }
        });
        this.retrieveLeaders();
    }
    //add highscore to firebase
    addToLeaderboard() {
        var name = this.state.name;
        var score = this.state.score;
        var users = this.leaderboardDatabase.ref('users');
        users.once('value')
            .then(function(snapshot) {
                var user = snapshot.child(name);
                var highscore = Math.max(user.val(), score);
                users.child(name).set(highscore);
            });
        this.setState({
            gameOver: false,
            start: true
        })
    }
    // retrieve top ten from firebase
    retrieveLeaders() {
        var users = this.leaderboardDatabase.ref('users');
        var topTenNames = this.topTenNames;
        var topTenScores = this.topTenScores;
        this.topTenScores = [1, 2, 3];
        users.orderByValue().limitToLast(10).on("value", function(snapshot) {
             snapshot.forEach(function(userSnap) {
                  topTenNames.push(userSnap.key);
                  topTenScores.push(userSnap.val());
          });
        });
        this.topTenScores = topTenScores.slice();
        this.topTenNames = topTenNames.slice();
    }
    //save local high score
    saveName(text) {
        this.setState({name: text});
        AsyncStorage.setItem("local_name", text);
    }
    //forces render of gameover screen
    gameOver(score){
        if (score > this.state.highscore){
            this.setState({
                score : score,
                gameOver : true,
                highscore: score,
                start : false
            });
            AsyncStorage.setItem("Local_highscore", this.state.highscore.toString());
        }
        else{
            this.setState({
                gameOver: true,
                start : false,
                score : score
            });
        }
    }
    //start the game
    startGame(){
        this.grid.startGame();
        this.setState({start: false})
        this.retrieveLeaders();
    }
    //resume the game from pause
    resume(){
        this.setState({paused:!this.state.paused});
        this.grid.setState({paused:!this.grid.state.paused});
    }
    //resume the game from leaderboard
    resumeL(){
        this.setState({leaderboard:false});
        this.grid.setState({paused:!this.grid.state.paused});
    }
    //restart the game from gameOver
    restart(){
        this.setState({gameOver:!this.state.gameOver});
        this.startGame();
    }
    //pause the game
    pause(score){
        this.setState({
            paused: true,
            score : score
        });
    }
    //forces re-render of leaderboard
    leader(){
        this.setState({leaderboard:!this.state.leaderboard});
    }
    //renders paused screen
    renderPaused(){
        return(
            <Pause
            score = {this.state.score}
            highscore = {this.state.highscore}
            name = {this.state.name}
            resume = {this.resume.bind(this)}
            />
        )
    }
    //renders leaderboard
    renderLeaders(){
        this.retrieveLeaders();
        return(
            <Leaderboard users = {this.topTenNames} scores = {this.topTenScores} resume = {this.resumeL.bind(this)}/>
        )
    }
    //renders game grid
    renderGrid(){
        return (
            <View style ={styles.container}>
                <Grid w = {5} h = {8} ref = {(c) => {this.grid = c;}} leader = {this.leader.bind(this)} gameOver = {this.gameOver.bind(this)} pause = {this.pause.bind(this)}/>
        	</View>
        );
    }
    //renders gameover screen
    renderGameOver() {
        return (
            <GameOver restart = {this.restart.bind(this)} saveName = {this.saveName.bind(this)} addToLeaderboard = {this.addToLeaderboard.bind(this)} score = {this.state.score}/>
        )
    }

    render() {
        return (<View style={{flex: 1}}>
            <Start visible = {this.state.start} startGame = {this.startGame.bind(this)}>
            </Start>
            {this.renderGrid()}
            {this.state.gameOver ? this.renderGameOver():null}
            {this.state.paused ? this.renderPaused():null}
            {this.state.leaderboard ? this.renderLeaders():null}
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1
    },

});

export default Game;
