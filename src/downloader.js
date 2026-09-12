const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const http = require("http");
const crypto = require("crypto");

const getFallbackUrls = (url) => {
  return [
    `https://ghproxy.net/${url}`,
    `https://mirror.ghproxy.com/${url}`
  ];
};

const verifyFileSize = (filePath, expectedSize) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const fileStats = fs.statSync(filePath);
  return fileStats.size === expectedSize;
};

const verifyFileIntegrity = (filePath, expectedSha256) => {
  if (!expectedSha256 || !fs.existsSync(filePath)) {
    return false;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return fileHash === expectedSha256.toLowerCase();
};

const resolveAssetPath = (preset, localAssetsDir, userCacheDir) => {
  if (localAssetsDir) {
    const candidatePath = path.join(localAssetsDir, preset.filename);
    if (verifyFileSize(candidatePath, preset.expectedSize)) {
      return candidatePath;
    }
    const rootCandidatePath = path.join(localAssetsDir, "..", preset.filename);
    if (verifyFileSize(rootCandidatePath, preset.expectedSize)) {
      return rootCandidatePath;
    }
  }

  if (userCacheDir) {
    const cacheCandidatePath = path.join(userCacheDir, preset.filename);
    if (verifyFileSize(cacheCandidatePath, preset.expectedSize)) {
      return cacheCandidatePath;
    }
  }

  return null;
};

const getUserCacheDirectory = () => {
  const homeDirectory = os.homedir();
  const cachePath = path.join(homeDirectory, ".opencode-deepseek-cache");
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }
  return cachePath;
};

const downloadStream = (requestUrl, destinationPath, onProgress, timeoutMs, redirectHops = 0) => {
  return new Promise((resolve, reject) => {
    if (redirectHops > 5) {
      reject(new Error("Too many redirects"));
      return;
    }

    const parsedUrl = new URL(requestUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const request = client.get(
      requestUrl,
      {
        timeout: timeoutMs,
        headers: {
          "User-Agent": "opencode-deepseek-downloader"
        }
      },
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          const redirectLocation = response.headers.location;
          if (!redirectLocation) {
            reject(new Error("Redirect header missing"));
            return;
          }
          const nextUrl = new URL(redirectLocation, requestUrl).toString();
          downloadStream(nextUrl, destinationPath, onProgress, timeoutMs, redirectHops + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Server returned HTTP ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
        let downloadedBytes = 0;

        const fileStream = fs.createWriteStream(destinationPath);

        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          if (onProgress && typeof onProgress === "function") {
            onProgress(downloadedBytes, totalBytes);
          }
        });

        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => resolve());
        });

        fileStream.on("error", (error) => {
          if (fs.existsSync(destinationPath)) {
            fs.unlinkSync(destinationPath);
          }
          reject(error);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy();
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }
      reject(new Error("Download connection timed out"));
    });

    request.on("error", (error) => {
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }
      reject(error);
    });
  });
};

const downloadWithFallback = async (preset, targetPath, onProgress, onFallbackTriggered) => {
  const temporaryDownloadPath = `${targetPath}.download`;
  const initialTimeoutMs = 15000;
  const standardTimeoutMs = 30000;

  const candidateUrls = [preset.remoteUrl, ...getFallbackUrls(preset.remoteUrl)];

  let downloadSucceeded = false;
  let finalError = null;

  for (let index = 0; index < candidateUrls.length; index += 1) {
    const currentUrl = candidateUrls[index];
    const isFallbackAttempt = index > 0;
    const currentTimeout = isFallbackAttempt ? standardTimeoutMs : initialTimeoutMs;

    if (isFallbackAttempt && onFallbackTriggered) {
      onFallbackTriggered(currentUrl);
    }

    try {
      await downloadStream(
        currentUrl,
        temporaryDownloadPath,
        onProgress,
        currentTimeout
      );

      const isValidSize = verifyFileSize(temporaryDownloadPath, preset.expectedSize);
      const isValidHash = verifyFileIntegrity(temporaryDownloadPath, preset.sha256);
      if (!isValidSize || !isValidHash) {
        if (fs.existsSync(temporaryDownloadPath)) {
          fs.unlinkSync(temporaryDownloadPath);
        }
        throw new Error("Downloaded asset failed integrity verification");
      }

      fs.renameSync(temporaryDownloadPath, targetPath);
      downloadSucceeded = true;
      break;
    } catch (error) {
      finalError = error;
      if (fs.existsSync(temporaryDownloadPath)) {
        fs.unlinkSync(temporaryDownloadPath);
      }
    }
  }

  if (!downloadSucceeded) {
    throw finalError || new Error("Failed to download asset from all available mirrors");
  }

  return targetPath;
};

module.exports = {
  getFallbackUrls,
  verifyFileSize,
  verifyFileIntegrity,
  resolveAssetPath,
  getUserCacheDirectory,
  downloadWithFallback
};
