import {proxyHost} from "../utils/phoenix-utils";

function loadAsync(loader, url, onProgress) {
  return new Promise((resolve, reject) => loader.load(url, resolve, onProgress, reject));
}

export default class HubsTextureLoader {
  static crossOrigin = "anonymous";

  constructor(manager = THREE.DefaultLoadingManager) {
    this.manager = manager;
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();

    this.loadTextureAsync(texture, url, onProgress)
      .then(onLoad)
      .catch(onError);

    return texture;
  }

  async loadTextureAsync(texture, src, onProgress) {
    let imageLoader;

    const proxyHeader = `https://${proxyHost}/`;
    const localHeader = `${location.protocol}//${location.host}/`;
    if (/^(https?:)?\/\//i.test(src) && !src.startsWith(localHeader) && !src.startsWith(proxyHeader)) {
      src = `https://${proxyHost}/` + encodeURIComponent(src);
    }

    if (window.createImageBitmap !== undefined) {
      imageLoader = new THREE.ImageBitmapLoader(this.manager);
      texture.flipY = false;
    } else {
      imageLoader = new THREE.ImageLoader(this.manager);
    }

    imageLoader.setCrossOrigin(this.crossOrigin);
    imageLoader.setPath(this.path);

    const cacheKey = this.manager.resolveURL(src);

    texture.image = await loadAsync(imageLoader, src, onProgress);

    // Image was just added to cache before this function gets called, disable caching by immediatly removing it
    THREE.Cache.remove(cacheKey);

    texture.needsUpdate = true;

    texture.onUpdate = function() {
      // Delete texture data once it has been uploaded to the GPU
      texture.image.close && texture.image.close();
      delete texture.image;
    };

    return texture;
  }

  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setPath(value) {
    this.path = value;
    return this;
  }
}
