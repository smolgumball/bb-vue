export async function main(ns) {
  let discoMode = false
  if (ns.args.length && ns.args[0] == 'discoMode.exe') discoMode = true

  addScanlines(true, discoMode)
  ns.atExit(() => {
    setTimeout(() => {
      addScanlines(false)
    }, 1000)
  })

  while (true) await ns.asleep(10000)
}

function addScanlines(enableDisable = true, discoMode) {
  const doc = globalThis['document']
  const docRoot = doc['documentElement']
  let existingStyles = doc.getElementById('__scanlineStyles')
  if (existingStyles) existingStyles.remove()

  docRoot.classList.toggle('__scanlines', enableDisable)

  if (enableDisable === true) {
    const discoModeAdditions = `
      .__scanlines {
        animation: __scanlineDisco 10s ease infinite alternate;
      }

      @keyframes __scanlineDisco {
        from {
          filter: hue-rotate(0deg);
        }
        to {
          filter: hue-rotate(360deg);
        }
      }
    `
    doc.querySelector('body').insertAdjacentHTML(
      'afterbegin',
      `
        <style id="__scanlineStyles" type="text/css">
          .__scanlines:before,
          .__scanlines:after {
            display: block;
            pointer-events: none;
            content: '';
            position: fixed;
          }
          .__scanlines:before {
            width: 100%;
            height: 2px;
            z-index: 10001;
            background: rgba(0, 0, 0, 0.3);
            opacity: 0.5;
            animation: scanline 2s ease infinite;
          }
          .__scanlines:after {
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 10000;
            background: linear-gradient(to bottom, transparent 50%, rgba(0, 128, 0, 0.3) 51%);
            background-size: 100% 4px;
            -webkit-animation: scanlines 2s ease infinite;
            animation: scanlines 2s ease infinite;
          }

          /* ANIMATE UNIQUE SCANLINE */
          @-webkit-keyframes scanline {
            0% {
              transform: translate3d(0, 200000%, 0);
            }
          }
          @keyframes scanline {
            0% {
              transform: translate3d(0, 200000%, 0);
            }
          }
          @-webkit-keyframes scanlines {
            0% {
              background-position: 0 50%;
              bottom: 0%;
            }
          }
          @keyframes scanlines {
            0% {
              background-position: 0 50%;
              bottom: 0%;
            }
          }
          ${discoMode ? discoModeAdditions : ''}
        </style>
      `
    )
  }
}
