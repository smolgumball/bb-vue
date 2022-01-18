export default `
.prism-editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  overflow: auto;
  tab-size: 1.5em;
  -moz-tab-size: 1.5em;
}

.prism-editor__container {
  position: relative;
  text-align: left;
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
  width: 100%;
}

.prism-editor__line-numbers {
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  padding-top: 4px;
  margin-top: 0;
  margin-right: 10px;
}
.prism-editor__line-number {
  /* padding: 0 3px 0 5px; */
  text-align: right;
  white-space: nowrap;
}

.prism-editor__textarea {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  resize: none;
  color: inherit;
  overflow: hidden;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-text-fill-color: transparent;
}

.prism-editor__textarea,
.prism-editor__editor {
  margin: 0;
  border: 0;
  background: none;
  box-sizing: inherit;
  display: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  font-variant-ligatures: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  tab-size: inherit;
  text-indent: inherit;
  text-rendering: inherit;
  text-transform: inherit;
  white-space: pre-wrap;
  word-wrap: keep-all;
  overflow-wrap: break-word;
  padding: 0;
  outline: none;
}
.prism-editor__textarea--empty {
  -webkit-text-fill-color: var(--bbvSuccessColor);
}
/* highlight */
.prism-editor__editor {
  position: relative;
  pointer-events: none;
}`