import axios from 'axios';
import queryString from 'querystring';
import React, { Component, PureComponent } from 'react';
import {
  FlatList,
  Text,
  TouchableHighlight,
  View,
  YellowBox
} from 'react-native';
import fixtures from './fixtures.json';
import styles from './style';

YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Module RCTImageLoader'
]);

class ListItem extends PureComponent {
  _onPress = () => {
    this.props.onPressItem(this.props.item, this.props.index);
  };

  render() {
    const { item } = this.props;
    if (item) {
      const { name } = item;
      // const price = item.price_formatted;
      // const image = item.img_url;
      return (
        <TouchableHighlight onPress={this._onPress} underlayColor="#dddddd">
          <View>
            <View style={styles.rowContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            </View>
            <View style={styles.separator} />
          </View>
        </TouchableHighlight>
      );
    }
    return null;
  }
}

export default class Tournaments extends Component<> {
  static navigationOptions = {
    title: 'Tournaments'
  };

  constructor(props) {
    super(props);
    console.log(this.props.navigation.state.params.token);
    this.state = { player: {}, tournaments: [], scores: {} };
  }

  componentDidMount() {
    this.getPlayerData();
    this.getTournamentData();
  }

  getPlayerData = async () => {
    try {
      const { token } = this.props.navigation.state.params;
      const { data } = await axios({
        method: 'get',
        baseURL: fixtures.baseUrl,
        url: 'player',
        headers: { Authorization: token }
      });
      this.setState(() => ({
        player: data
      }));
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Load all active tournaments
   */
  getTournamentData = async () => {
    try {
      const { token, player } = this.props.navigation.state.params;
      const { data } = await axios({
        method: 'get',
        baseURL: fixtures.baseUrl,
        url: 'tournaments',
        headers: { Authorization: token }
      });
      this.setState(() => ({
        tournaments: data
      }));

      // if only one tournament navigate to next screen
      if (data.length === 1) {
        this._skipScreen(token, player, data[0]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  _keyExtractor = (item, index) => index.toString();

  _renderItem = ({ item, index }) => (
    <ListItem item={item} index={index} onPressItem={this._onPressItem} />
  );

  _onPressItem = async item => {
    // get or create scores for player in selected tournament
    const { token, player } = this.props.navigation.state.params;
    await this.getScoreData(token, item._id);
    this._navigate(token, player, item, this.state.scores);
  };

  getScoreData = async (token, tournamentId) => {
    // get or create scores for player in selected tournament
    try {
      const query = queryString.stringify({ tournamentId });
      const { data } = await axios({
        method: 'get',
        baseURL: fixtures.baseUrl,
        url: `enter?${query}`,
        headers: { Authorization: token }
      });
      this.setState(() => ({ scores: data }));
    } catch (e) {
      console.log(e);
    }
  };

  _skipScreen = async (token, player, tournament) => {
    await this.getScoreData(token, tournament._id);
    this._navigate(token, player, tournament, this.state.scores);
  };

  _navigate = (token, player, tournament, scores) => {
    // navigate to next screen
    this.props.navigation.navigate('games', {
      token,
      player,
      tournament,
      scores
    });
  };

  render() {
    return (
      <FlatList
        data={this.state.tournaments}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderItem}
      />
    );
  }
}
