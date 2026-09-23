function buildTree(files) {
  const root = { name: "", children: {}, files: [] };

  for (const item of files) {
    if (item.isDir) continue;

    const parts = item.path.split("/").filter(Boolean);
    let node = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts[i];
      if (!node.children[folder]) {
        node.children[folder] = { name: folder, children: {}, files: [] };
      }
      node = node.children[folder];
    }

    node.files.push(item);
  }

  return root;
}

export default buildTree;
