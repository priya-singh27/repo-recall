export default function FileTree({ node, depth = 0, selected, onToggle }) {
    const folders = Object.values(node.children).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const files = [...node.files].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  
    return (
      <div>
        {folders.map((folder) => (
          <div key={folder.name}>
            <div style={{ paddingLeft: depth * 16, fontWeight: 600 }}>
              📁 {folder.name}
            </div>
            <FileTree
              node={folder}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          </div>
        ))}
        {files.map((file) => (
          <label
            key={file.path}
            style={{ display: "block", paddingLeft: depth * 16 }}
          >
            <input
              type="checkbox"
              checked={selected.includes(file.path)}
              onChange={() => onToggle(file.path)}
            />
            {file.name}
          </label>
        ))}
      </div>
    );
}