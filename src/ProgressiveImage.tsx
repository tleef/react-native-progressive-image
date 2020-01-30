import Cache from "@tleef/expo-image-cache";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { Easing } from "react-native-reanimated";

const cache = new Cache();
const { Value, timing } = Animated;

export interface ImageSource {
  uri: string;
}

export interface ProgressiveImageProps {
  noCache: boolean;
  noPreview: boolean;
  noAnimation: boolean;
  imageUri?: string;
  imageSource?: ImageSource;
  previewUri?: string;
  previewSource?: ImageSource;
  previewBlurRadius: number;
  animDuration: number;
  style?: any;
}

export interface ProgressiveImageState {
  imageUri?: string;
}

export default class ProgressiveImage<
  P extends ProgressiveImageProps = ProgressiveImageProps,
  S extends ProgressiveImageState = ProgressiveImageState
> extends React.Component<P, S> {
  public static defaultProps = {
    noCache: false,
    noPreview: false,
    noAnimation: false,
    previewBlurRadius: 2,
    animDuration: 500,
  };

  private readonly opacity: Animated.Value<number>;
  private readonly anim: Animated.BackwardCompatibleWrapper;
  private animFinished: boolean;

  constructor(props: P) {
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

  public componentDidUpdate(prevProps: Readonly<ProgressiveImageProps>): void {
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
    let { style } = this.props;

    return (
      <View style={[styles.container, style]}>
        {this.renderPreview()}
        {this.renderImage()}
      </View>
    );
  }

  protected renderPreview() {
    let {
      noPreview,
      previewUri,
      previewSource,
      previewBlurRadius,
    } = this.props;

    previewSource = previewUri ? { uri: previewUri } : previewSource;

    if (noPreview || !previewSource) {
      return null;
    }

    return (
      <Image
        style={styles.image}
        blurRadius={previewBlurRadius}
        source={previewSource}
      />
    );
  }

  protected renderImage() {
    let { noCache, noAnimation } = this.props;

    let imageSource;
    if (!noCache && this.state.imageUri) {
      imageSource = { uri: this.state.imageUri };
    } else if (noCache && this.props.imageUri) {
      imageSource = { uri: this.props.imageUri };
    } else if (noCache && this.props.imageSource) {
      imageSource = this.props.imageSource;
    }

    if (!imageSource) {
      return null;
    }

    if (noAnimation) {
      return <Image style={styles.image} source={imageSource} />;
    }

    return (
      <Animated.Image
        style={[styles.image, { opacity: this.opacity }]}
        source={imageSource}
        onLoad={this.onImageLoad}
      />
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
