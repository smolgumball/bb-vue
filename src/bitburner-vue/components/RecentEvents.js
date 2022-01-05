import { css, html, toJson, projectGlobals } from '/bitburner-vue/lib.js'

export default {
  name: 'recent-events',
  style: css`
    .recent_events {
      padding: 0 0 0.8em 0;
      white-space: normal;
      height: var(--sglCardHeight);

      .event {
        display: block;
        padding: 0.8em;
        overflow: auto;

        &.odd {
          background-color: fade-out(#002b36, 0.5);
        }
      }

      .event_header {
        display: flex;
        justify-content: space-between;
      }

      .event_time {
        color: var(--sglFontLightColor);
        opacity: 0.3;
      }

      .event_details {
        white-space: pre;
        overflow: auto;
      }
    }
  `,
  template: html`
    <div class="recent_events sgl--json_display">
      <div
        class="event"
        :class="{ odd: logItem.isOdd }"
        v-for="logItem in store.items"
        :key="logItem.uuid"
      >
        <div class="event_header">
          <div class="event_type">{{logItem.type}}</div>
          <div class="event_time">{{ logItem.time }}</div>
        </div>
        <div class="event_details">{{ toJson(logItem.event) }}</div>
      </div>
    </div>
  `,
  computed: {
    store() {
      return projectGlobals.store.data.recentEvents
    },
  },
  methods: {
    toJson,
  },
}
