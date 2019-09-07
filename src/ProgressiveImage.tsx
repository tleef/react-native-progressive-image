import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

const { Value, timing } = Animated;

interface ISource {
  uri: string;
}

interface IProps {
  key?: string;
  imageUri?: string;
  imageSource?: ISource;
  previewUri?: string;
  previewSource?: ISource;
  previewBlurRadius?: number;
  style?: any;
}

interface IContainerProps {
  key?: string;
  style: any;
}

interface IPreviewProps {
  key?: string;
  style: any;
  blurRadius: number;
  source: ISource;
}

interface IImageProps {
  key?: string;
  style: any;
  source: ISource;
  onLoad: () => void;
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

const emptySource = { uri: "" };

export default class ProgressiveImage extends React.PureComponent<IProps> {
  private readonly opacity: Animated.Value<number>;
  private readonly anim: Animated.BackwardCompatibleWrapper;

  constructor(props: any) {
    super(props);

    this.opacity = new Value(0);
    this.anim = timing(this.opacity, {
      duration: 500,
      toValue: 1,
      easing: Easing.inOut(Easing.ease),
    });

    this.onImageLoad = this.onImageLoad.bind(this);
  }

  public render() {
    let {
      key,
      imageUri,
      imageSource,
      previewUri,
      previewSource,
      previewBlurRadius,
      style,
    } = this.props;

    imageSource = imageUri ? { uri: imageUri } : imageSource;
    previewSource = previewUri ? { uri: previewUri } : previewSource;

    const containerProps: IContainerProps = {
      style: styles.container,
    };

    const previewProps: IPreviewProps = {
      style: styles.image,
      blurRadius: typeof previewBlurRadius === "number" ? previewBlurRadius : 2,
      source: previewSource || emptySource,
    };

    const imageProps: IImageProps = {
      style: [styles.image, { opacity: this.opacity }],
      source: imageSource || emptySource,
      onLoad: this.onImageLoad,
    };

    if (style) {
      containerProps.style = [styles.container, style];
    }

    if (key) {
      containerProps.key = `${key}-container`;
      previewProps.key = `${key}-preview`;
      imageProps.key = `${key}-image`;
    }

    return (
      <View {...containerProps}>
        <Image {...previewProps} />
        <Animated.Image {...imageProps} />
      </View>
    );
  }

  private onImageLoad() {
    this.anim.start();
  }
}
