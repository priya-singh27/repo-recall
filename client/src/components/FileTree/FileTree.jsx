import './FileTree.css'

export default function FileTree({ node, depth = 0, selected, onToggle, readOnly = false }) {
    const folders = Object.values(node.children).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const files = [...node.files].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  
    return (
      <div className="file-tree">
        {folders.map((folder) => (
          <div key={folder.name}>
            <div className="file-tree__folder" style={{ paddingLeft: depth * 16 }}>
              {folder.name}
            </div>
            <FileTree
              node={folder}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
              readOnly={readOnly}
            />
          </div>
        ))}
        {files.map((file) => (
          <label
            key={file.path}
            className={`file-tree__file${selected.includes(file.path) ? " file-tree__file--selected" : ""}`}
            style={{ paddingLeft: depth * 16 }}
          >
            <input
              type="checkbox"
              checked={selected.includes(file.path)}
              disabled={readOnly}
              onChange={() => {
                if (!readOnly) onToggle(file.path);
              }}
            />
            {file.name}
          </label>
        ))}
      </div>
    );
}