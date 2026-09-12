const presets = [
  {
    id: "feisha-1080p",
    titleKey: "feisha1080",
    type: "video",
    filename: "feisha-1080p.mp4",
    expectedSize: 6445227,
    sha256: "cce0a170d91fb93f6d97199d5c98078b7c275928a5b852cded1dd582fd5173b5",
    remoteUrl: "https://github.com/daemon1s/opencode-deepseek-chan/releases/download/v1.0.0/feisha-1080p.mp4"
  },
  {
    id: "zipzip-1080p",
    titleKey: "zipzip1080",
    type: "video",
    filename: "zipzip-1080p.mp4",
    expectedSize: 11418597,
    sha256: "4f7e026b2b7bda9b527ab261b896464197bf1fe103897c172404b8431fce2af7",
    remoteUrl: "https://github.com/daemon1s/opencode-deepseek-chan/releases/download/v1.0.0/zipzip-1080p.mp4"
  },
  {
    id: "midnight-1080p",
    titleKey: "midnight1080",
    type: "video",
    filename: "midnight-1080p.mp4",
    expectedSize: 20221147,
    sha256: "f44d1e271cd2e66846b88feefe3bc5478e46c204a7d9d40810dc02c706be98c4",
    remoteUrl: "https://github.com/daemon1s/opencode-deepseek-chan/releases/download/v1.0.0/midnight-1080p.mp4"
  },
  {
    id: "static-4k",
    titleKey: "static4k",
    type: "image",
    filename: "artwork-4k.png",
    expectedSize: 9552989,
    sha256: "fe13cd17bbd9aa48bb6be47cc31ed2f2ab50d74c93d58ccc9af5599322d8f133",
    remoteUrl: "https://github.com/daemon1s/opencode-deepseek-chan/releases/download/v1.0.0/artwork-4k.png"
  }
];

const getPresetById = (id) => {
  if (!id || typeof id !== "string") {
    return null;
  }
  const normalizedId = id.trim().toLowerCase();
  return presets.find((preset) => preset.id.toLowerCase() === normalizedId) || null;
};

module.exports = {
  presets,
  getPresetById
};
