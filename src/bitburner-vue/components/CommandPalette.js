import { registerEvent, projectGlobals, css, html, toJson } from '/bitburner-vue/lib.js'
import {
  RebootApplication,
  TestCommandFast,
  TestCommandSlow,
  TestCommandFail,
} from '/bitburner-vue/ui.commands.js'

const CommandTemplates = [RebootApplication, TestCommandFast, TestCommandSlow, TestCommandFail]

export default {
  name: 'command-palette',
  style: css`
    .command_palette {
      .commands_wrap {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        align-content: flex-start;
        margin-bottom: 10px;
      }

      .command_trigger {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }

      .command_title {
        margin-bottom: 0.5em;
        margin-right: 1em;
      }

      .command_reports {
        --spd: 0.5s;
        transition: height var(--spd), padding var(--spd), margin var(--spd);
        transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
        display: flex;
        justify-content: flex-start;
        overflow: auto;

        &:not(.hasCommandReports) {
          height: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        &.hasCommandReports {
          overflow: auto;
          max-height: 350px;
          padding-bottom: 1em;
        }
      }

      .command_report {
        position: relative;
        flex-shrink: 0;
        height: 155px;
        width: 20%;
        min-width: 315px;
        margin-left: 1em;
        background-color: var(--sglCardBgColor);
        transition: border-color 0.1s, width 0.2s, height 0.2s, opacity 0.2s;
        border-top: 4px solid transparent;
        border-radius: 10px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;

        &.showDetails {
          display: flex;
          background-color: unset;
          width: 700px;
          height: 335px;

          &[class] {
            opacity: 1;
          }

          .close_button {
            display: unset;
          }

          .sgl--json_display {
            width: 100%;
          }
        }

        &:not(.showDetails) {
          padding: 0.8em;
        }

        &:first-child {
          margin-left: 0;
        }

        &.statusQueued {
          opacity: 0.7;
        }

        &.statusRunning {
          transition: none;
          animation: sgl--borderFlashBusy 0.5s linear 0s infinite alternate;

          code > span.icon {
            animation: sgl--iconFlashBusy 0.25s linear 0s infinite alternate;
          }
        }

        .details_button,
        .close_button {
          position: absolute;
          top: 0.8em;
          right: 0;
          box-shadow: 0px 0px 12px 0px #0000002e;
        }

        .close_button {
          display: none;
          right: 4px;
        }
      }

      .command_report_list {
        margin: 0;

        .command_report_list_header {
          font-weight: bold;
          font-size: 1.2em;
          margin-bottom: 10px;
          max-width: 210px;
          white-space: nowrap;
          overflow: hidden;
        }

        .command_report_list_slug,
        .command_report_list_uuid {
          white-space: nowrap;
          overflow: hidden;
          opacity: 0.3;
        }

        .command_report_list_pair {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-top: 10px;

          & > strong {
            display: inline-block;
            margin-right: 10px;
          }

          & > code > span.icon {
            padding-left: 0.4em;
            display: inline-block;
            transform-origin: center;
          }
        }

        code {
          display: inline-block;
          white-space: nowrap;
          padding: 4px;
          border-radius: 5px;
          font-size: 11px;
          background-color: fade-out(black, 0.7);
          overflow: hidden;
        }
      }

      @keyframes sgl--borderFlashBusy {
        from {
          border-color: fade-out(lawngreen, 0.5);
        }

        to {
          border-color: fade-out(hotpink, 0.5);
        }
      }

      @keyframes sgl--iconFlashBusy {
        from {
          filter: hue-rotate(0deg);
          transform: scale(1) translateY(0);
        }

        to {
          filter: hue-rotate(360deg);
          transform: scale(1.4) translateY(5%);
        }
      }
    }
  `,
  template: html`
    <div class="command_palette">
      <div class="commands_wrap">
        <div
          class="command_trigger"
          v-for="command in commandTemplates"
          :key="command.slug"
          :id="command.slug"
        >
          <button class="command_title sgl--button" @click="run(command)">
            {{ command.name }}
          </button>
        </div>
        <div class="command_trigger">
          <button class="command_title sgl--button" @click="clearCommandReports">
            Clear Command Reports
          </button>
        </div>
      </div>
      <div class="command_reports sgl--enable_scrollbar" :class="{ hasCommandReports }">
        <div
          class="command_report"
          :class="classForCommandReport(report)"
          v-for="report in commandReports"
          :key="report.uuid"
        >
          <template v-if="report.showDetails">
            <div class="sgl--json_display">{{ toJson(report) }}</div>
          </template>
          <template v-else>
            <div class="command_report_list">
              <div class="command_report_list_header" :title="report.name">{{ report.name }}</div>
              <div class="command_report_list_slug" :title="report.state.slug">
                {{ report.slug }}
              </div>
              <div class="command_report_list_uuid" :title="report.state.uuid">
                {{ report.state.uuid || 'Waiting for UUID' }}
              </div>
              <div class="command_report_list_pair">
                <strong>Status:</strong>
                <code
                  >{{ commandReportStatus(report).label }}<span class="icon"
                    >{{ commandReportStatus(report).icon }}</span
                  ></code
                >
              </div>
              <div class="command_report_list_pair">
                <strong>Result:</strong> <code>{{ commandReportResult(report) }}</code>
              </div>
              <button
                class="details_button sgl--button sgl--button-sm"
                @click="report.showDetails = true"
              >
                Details
              </button>
            </div>
          </template>
          <div class="close_button sgl--button sgl--button-sm" @click="report.showDetails = false">
            ×
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      commandTemplates: CommandTemplates,
      commandReports: [],
    }
  },
  computed: {
    store() {
      return projectGlobals.store.data
    },
    hasCommandReports() {
      return this.commandReports.length
    },
    staleCommandReports() {
      return this.commandReports.filter((report) => report.state.didSucceed || report.state.didFail)
    },
  },
  methods: {
    toJson,
    run(commandTemplate) {
      let command = this.createCommandFromTemplate(commandTemplate)
      this.commandReports = [command, ...this.commandReports]
      command.executeFn(command, this)
    },
    createCommandFromTemplate(commandTemplate) {
      return projectGlobals.Modules.Vue.reactive({
        ...commandTemplate,
        uuid: crypto.randomUUID(),
        showDetails: false,
        state: { isQueued: true },
      })
    },
    findCommandBySlug(slug) {
      return this.commandTemplates.find((cmd) => cmd.slug == slug)
    },
    isCommandDisabledBySlug(slug) {
      return this.commandReports.some((cmd) => {
        if (cmd.slug !== slug) return false
        return cmd.state.isRunning || cmd.state.isQueued
      })
    },
    clearCommandReports() {
      this.commandReports = this.commandReports.filter(
        (report) => !this.staleCommandReports.includes(report)
      )
    },
    handleRemoteInvocation(event) {
      let requestedCommandTemplate = this.findCommandBySlug(event.commandSlug)
      if (!requestedCommandTemplate)
        throw new Error(`UI command template could not be found for '${event.commandSlug}'`)
      this.run(requestedCommandTemplate)
    },
    classForCommandReport(report) {
      return {
        showDetails: report.showDetails,
        [`status${this.commandReportStatus(report).label}`]: true,
      }
    },
    commandReportStatus(report) {
      if (report.state.isQueued) return { label: 'Queued', icon: '⏳' }
      if (report.state.isRunning) return { label: 'Running', icon: '🏃' }
      if (report.state.didSucceed) return { label: 'Succeeded', icon: '✅' }
      if (report.state.didFail) return { label: 'Failed', icon: '❌' }
    },
    commandReportResult(report) {
      let toRet = '...'
      if (report.state.didSucceed) toRet = report.state.successValue
      if (report.state.didFail) toRet = report.state.failValue
      if (String(toRet).length > 25) toRet = 'Please see Details pane'
      return toRet
    },
  },
  created() {
    registerEvent('commandPalette:run', this.handleRemoteInvocation)
  },
}
