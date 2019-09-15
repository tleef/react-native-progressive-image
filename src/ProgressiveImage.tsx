import Cache from "@tleef/expo-image-cache";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

const cache = new Cache();
const { Value, timing } = Animated;

interface ISource {
  uri: string;
}

interface IProps {
  noCache: boolean;
  noPreview: boolean;
  imageUri?: string;
  imageSource?: ISource;
  previewUri?: string;
  previewSource?: ISource;
  previewBlurRadius: number;
  animDuration: number;
  style?: any;
}

interface IState {
  imageUri?: string;
}

export default class ProgressiveImage extends React.Component<IProps, IState> {
  public static defaultProps = {
    noCache: false,
    noPreview: false,
    previewBlurRadius: 2,
    animDuration: 500,
  };

  private readonly opacity: Animated.Value<number>;
  private readonly anim: Animated.BackwardCompatibleWrapper;
  private animFinished: boolean;

  constructor(props: IProps) {
    super(props);

    this.state = {
      imageUri: undefined,
    };

    this.opacity = new Value(0);
    this.animFinished = false;
    this.anim = timing(this.opacity, {
      duration: props.animDuration,
      toValue: 1,
      easing: Easing.inOut(Easing.ease),
    });

    this.onImageLoad = this.onImageLoad.bind(this);
    this.onAnimFinished = this.onAnimFinished.bind(this);
  }

  public componentDidMount() {
    this.resolveImageUri();
  }

  public componentDidUpdate(prevProps: Readonly<IProps>): void {
    let prevImageUri: string | undefined;
    if (prevProps.imageUri) {
      prevImageUri = prevProps.imageUri;
    } else if (prevProps.imageSource) {
      prevImageUri = prevProps.imageSource.uri;
    }

    let curImageUri: string | undefined;
    if (this.props.imageUri) {
      curImageUri = this.props.imageUri;
    } else if (this.props.imageSource) {
      curImageUri = this.props.imageSource.uri;
    }

    if (curImageUri !== prevImageUri) {
      this.reset();
      this.resolveImageUri();
    }
  }

  public reset() {
    this.opacity.setValue(0);
    this.animFinished = false;
    this.setState({
      imageUri: undefined,
    });
  }

  public async resolveImageUri() {
    if (this.props.noCache) {
      return;
    }

    let imageUri: string | undefined;
    if (this.props.imageUri) {
      imageUri = this.props.imageUri;
    } else if (this.props.imageSource) {
      imageUri = this.props.imageSource.uri;
    }

    if (!imageUri || !imageUri.startsWith("http")) {
      this.setState({
        imageUri,
      });
      return;
    }

    try {
      const localImageUri = await cache.getLocalUriAsync(imageUri);
      this.setState({
        imageUri: localImageUri,
      });
    } catch (e) {
      console.log(`Error while caching image, using remote URI: ${imageUri}`);
      console.log(e);
      this.setState({
        imageUri,
      });
    }
  }

  public render() {
    let {
      noCache,
      noPreview,
      previewUri,
      previewSource,
      previewBlurRadius,
      style,
    } = this.props;

    previewSource = previewUri ? { uri: previewUri } : previewSource;

    let imageSource;
    if (!noCache && this.state.imageUri) {
      imageSource = { uri: this.state.imageUri };
    } else if (noCache && this.props.imageUri) {
      imageSource = { uri: this.props.imageUri };
    } else if (noCache && this.props.imageSource) {
      imageSource = this.props.imageSource;
    }

    return (
      <View style={[styles.container, style]}>
        {!noPreview && previewSource ? (
          <Image
            style={styles.image}
            blurRadius={previewBlurRadius}
            source={previewSource}
          />
        ) : null}
        {imageSource ? (
          <Animated.Image
            style={[styles.image, { opacity: this.opacity }]}
            source={imageSource}
            onLoad={this.onImageLoad}
          />
        ) : null}
      </View>
    );
  }

  private onAnimFinished({ finished }: { finished: boolean }) {
    this.animFinished = finished;
  }

  private onImageLoad() {
    if (!this.animFinished) {
      this.anim.start(this.onAnimFinished);
    }
  }
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
