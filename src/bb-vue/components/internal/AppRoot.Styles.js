import { css } from '/bb-vue/lib.js'

export default {
  scssResources: css`
    @mixin typo-basic {
      & {
        font-family: 'FreeMono', monospace;
        font-size: 14px;
        font-weight: bold;
        line-height: 1.1;
      }
    }

    @mixin bbv-scrollbar($size: 4px, $width: $size, $height: $size) {
      &::-webkit-scrollbar {
        display: initial;

        @if $width {
          width: $width;
        } @else {
          width: $size;
        }

        @if $height {
          height: $height;
        } @else {
          height: $size;
        }
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--bbvScrollbarFgColor);
      }

      &::-webkit-scrollbar-track {
        background-color: var(--bbvScrollbarBgColor);
      }
    }
  `,
  scss: css`
    @font-face {
      font-family: 'FreeMono';
      src: url('https://gumballcdn.netlify.app/FreeMono.woff2') format('woff2');
    }

    body {
      --bbvScrollbarFgColor: #12b3e3;
      --bbvScrollbarBgColor: #0b1420;
      --bbvBorderColor: #0f4878;
      --bbvBoxShadowColor1: #0000007a;
      --bbvBoxShadowColor2: #040f18;
      --bbvAppInnerFgColor: #89d3e4;
      --bbvAppInnerBgColor: #274b64;
      --bbvFontLightColor: #89d3e4;
      --bbvFontLightAltColor: #89d3e4;
      --bbvButtonFgColor: #12b3e3;
      --bbvButtonBgColor: #0b1420;
      --bbvButtonHoverFgColor: #00fff3;
      --bbvButtonHoverBgColor: #162a47;
      --bbvWinTitlebarFgColor: #89d3e4;
      --bbvWinTitlebarBgColor: #0f4878;
      --bbvWinActionsFgColor: #83d5d9;
      --bbvWinActionsBgColor: #0f4878;
      --bbvHackerDarkFgColor: #c5c255;
      --bbvHackerDarkBgColor: #171c23;
      --bbvHackerDarkAltBgColor: #333146;
      --bbvAppTrayFgColor: #89d3e4;
      --bbvAppTrayBorderColor: #4bb4c5;
      --bbvAppTrayBgColor: #274b64;
      --bbvInputBorderColor: #357073;
      --bbvInputBorderFadeColor: #{fade-out(#357073, 0.5)};
      --bbvInputBgColor: #{fade-out(#274b64, 0.5)};
      --bbvActiveColor: #954ea7;
      --bbvSuccessColor: #4fb168;
      --bbvErrorColor: #984e4e;
      --bbvErrorDarkColor: #0b1420;
    }

    [bbv-root] {
      @include typo-basic;

      position: fixed;
      z-index: 1500;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
    }

    [bbv-foreground] {
      z-index: 1500;

      & > * {
        pointer-events: auto;
      }
    }

    .__CMP_NAME__ {
      * {
        box-sizing: border-box;
      }

      code,
      button,
      input,
      th,
      td,
      tr {
        @include typo-basic;
      }

      @keyframes bbvFlashBusy {
        from {
          filter: hue-rotate(0deg);
        }
        to {
          filter: hue-rotate(360deg);
        }
      }

      &.rootAppIntro-enter-active,
      &.rootAppIntro-leave-active,
      &.consumerRootIntro-enter-active,
      &.consumerRootIntro-leave-active {
        transition: opacity 0.4s ease;
      }

      &.rootAppIntro-enter-from,
      &.rootAppIntro-leave-to,
      &.consumerRootIntro-enter-from,
      &.consumerRootIntro-leave-to {
        opacity: 0;
      }
    }
  `,
}
