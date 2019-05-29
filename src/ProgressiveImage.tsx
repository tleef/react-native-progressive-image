import React from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

interface IProps {
  source: any;
  base64: string;
  style: any;
}

const styles = StyleSheet.create({
  image: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    position: "relative",
  },
});

export default class ProgressiveImage extends React.PureComponent<IProps> {
  private readonly _imageOpacity: Animated.Value;

  constructor(props: any) {
    super(props);

    this._imageOpacity = new Animated.Value(0);
  }

  public render() {
    const { source, base64, style } = this.props;

    return (
      <View style={[styles.container, style]}>
        <Image style={styles.image} blurRadius={2} source={{ uri: base64 }} />
        <Animated.Image
          style={[styles.image, { opacity: this._imageOpacity }]}
          source={source}
          onLoad={this.onImageLoad}
        />
      </View>
    );
  }

  public onImageLoad = () => {
    Animated.timing(this._imageOpacity, {
      toValue: 1,
    }).start();
  };
}
