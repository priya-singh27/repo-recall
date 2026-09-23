import './FileTree.css'

export default function FileTree({ node, depth = 0, selected, onToggle, onOpen, openPath, readOnly = false }) {
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
              onOpen={onOpen}
              openPath={openPath}
              readOnly={readOnly}
            />
          </div>
        ))}
        {files.map((file) => (
          <div
            key={file.path}
            className={`file-tree__file${selected.includes(file.path) ? " file-tree__file--selected" : ""}${openPath === file.path ? " file-tree__file--open" : ""}`}
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
            <button
              type="button"
              className="file-tree__open"
              onClick={() => onOpen?.(file.path)}
            >
              {file.name}
            </button>
          </div>
        ))}
      </div>
    );
}