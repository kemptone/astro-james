import {useEffect, useRef, useState} from 'preact/hooks'
import type {ComponentChildren} from 'preact'
import {
  initialWorkspace,
  minimumChoiceOptions,
  newOption,
  newSetting,
  normalizeGroup,
  readWorkspace,
  removeGroup,
  storageKey,
  typeLabels,
  validateGroup,
  type Group,
  type Setting,
  type Workspace,
} from '@/core/settings-builder'

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ComponentChildren
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      class="builder-dialog"
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
    >
      <div class="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          class="block-button close-button"
          aria-label="Close dialog"
          onClick={() => ref.current?.close()}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}

type ModalContent = {label: string; message: string}

function SettingControl({
  item,
  onChange,
  onOpen,
}: {
  item: Setting
  onChange: (item: Setting) => void
  onOpen: (content: ModalContent) => void
}) {
  const labelId = `label-${item.id}`
  const descriptionId = item.description ? `description-${item.id}` : undefined

  switch (item.type) {
    case 'slider': {
      const {min, max, step, value, disabled} = item
      const fill = ((value - min) / (max - min)) * 100
      return (
        <div class="range-control">
          <input
            class="range-track"
            type="range"
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            min={min}
            max={max}
            step={step ?? 'any'}
            value={value}
            disabled={disabled}
            style={{'--fill': `${fill}%`}}
            onInput={event =>
              onChange({...item, value: event.currentTarget.valueAsNumber})
            }
          />
          <output class="range-value" aria-hidden="true">
            {value}
          </output>
        </div>
      )
    }
    case 'choice':
      return (
        <div
          class="choice-control"
          role="group"
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
        >
          {item.options.map(choice => (
            <button
              key={choice.id}
              type="button"
              class="block-button"
              aria-pressed={item.value === choice.id}
              disabled={item.disabled || choice.disabled}
              onClick={() => onChange({...item, value: choice.id})}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )
    case 'toggle':
      return (
        <button
          type="button"
          class="switch-control"
          role="switch"
          aria-checked={item.value}
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          disabled={item.disabled}
          onClick={() => onChange({...item, value: !item.value})}
        >
          <span class="switch-track" aria-hidden="true">
            <span />
          </span>
          <span aria-hidden="true">{item.value ? 'On' : 'Off'}</span>
        </button>
      )
    case 'button':
      return (
        <button
          type="button"
          class="block-button"
          disabled={item.disabled}
          aria-describedby={descriptionId}
          aria-label={`Open ${item.label}`}
          onClick={() => onOpen({label: item.label, message: item.message})}
        >
          Open <span aria-hidden="true">▣</span>
        </button>
      )
  }
}

function SettingEditor({
  item,
  onChange,
  onRemove,
}: {
  item: Setting
  onChange: (item: Setting) => void
  onRemove: () => void
}) {
  return (
    <div class="setting-editor">
      <label>
        Label
        <input
          value={item.label}
          onInput={event =>
            onChange({...item, label: event.currentTarget.value})
          }
        />
      </label>
      <label>
        Description
        <textarea
          rows={2}
          value={item.description}
          onInput={event =>
            onChange({...item, description: event.currentTarget.value})
          }
        />
      </label>
      {item.type === 'slider' && (
        <div class="editor-columns">
          {(
            [
              ['min', 'Min'],
              ['value', 'Value'],
              ['max', 'Max'],
            ] as const
          ).map(([field, label]) => (
            <label key={field}>
              {label}
              <input
                type="number"
                step="any"
                value={Number.isFinite(item[field]) ? item[field] : ''}
                onInput={event =>
                  onChange({
                    ...item,
                    [field]: event.currentTarget.valueAsNumber,
                  })
                }
              />
            </label>
          ))}
          <div class="slider-step">
            <label>
              Step
              <input
                type="number"
                step="any"
                aria-describedby={`step-help-${item.id}`}
                value={Number.isFinite(item.step) ? item.step : ''}
                onInput={event => {
                  const input = event.currentTarget
                  onChange({
                    ...item,
                    step:
                      input.value === '' && !input.validity.badInput
                        ? undefined
                        : input.valueAsNumber,
                  })
                }}
              />
            </label>
            <span id={`step-help-${item.id}`} class="field-help">
              Use a positive number such as 0.5 or 5. Leave blank for free
              movement.
            </span>
          </div>
        </div>
      )}
      {item.type === 'choice' && (
        <fieldset class="option-editor">
          <legend>Options</legend>
          {item.options.map((choice, index) => {
            const update = (next: typeof choice) =>
              onChange({
                ...item,
                options: item.options.map(option =>
                  option.id === choice.id ? next : option,
                ),
              })
            return (
              <div class="option-row" key={choice.id}>
                <label>
                  Option {index + 1}
                  <input
                    value={choice.label}
                    onInput={event =>
                      update({...choice, label: event.currentTarget.value})
                    }
                  />
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={choice.disabled}
                    onChange={event =>
                      update({...choice, disabled: event.currentTarget.checked})
                    }
                  />
                  Disabled
                </label>
                <button
                  type="button"
                  class="block-button"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={item.options.length <= minimumChoiceOptions}
                  onClick={() =>
                    onChange({
                      ...item,
                      options: item.options.filter(
                        option => option.id !== choice.id,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            )
          })}
          <button
            type="button"
            class="block-button"
            onClick={() =>
              onChange({...item, options: [...item.options, newOption()]})
            }
          >
            + Add option
          </button>
        </fieldset>
      )}
      {item.type === 'toggle' && (
        <label class="check-label">
          <input
            type="checkbox"
            checked={item.value}
            onChange={event =>
              onChange({...item, value: event.currentTarget.checked})
            }
          />
          Switch is on
        </label>
      )}
      {item.type === 'button' && (
        <label>
          Modal message
          <textarea
            rows={3}
            value={item.message}
            onInput={event =>
              onChange({...item, message: event.currentTarget.value})
            }
          />
        </label>
      )}
      <div class="editor-actions">
        <label class="check-label">
          <input
            type="checkbox"
            checked={item.disabled}
            onChange={event =>
              onChange({...item, disabled: event.currentTarget.checked})
            }
          />
          Disable setting
        </label>
        <button
          type="button"
          class="block-button remove-setting"
          onClick={onRemove}
        >
          Remove setting
        </button>
      </div>
    </div>
  )
}

function GroupEditor({
  group,
  creating,
  onClose,
  onSave,
  onDelete,
}: {
  group: Group
  creating: boolean
  onClose: () => void
  onSave: (group: Group) => void
  onDelete: (group: Group) => void
}) {
  const [draft, setDraft] = useState(group)
  const [expanded, setExpanded] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const focusNewSetting = useRef(false)
  const backButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirmDelete) backButton.current?.focus()
  }, [confirmDelete])

  useEffect(() => {
    if (focusNewSetting.current) {
      form.current
        ?.querySelector<HTMLInputElement>(`#edit-${expanded} input`)
        ?.focus()
      focusNewSetting.current = false
    }
  }, [expanded])

  return (
    <Dialog
      title={
        confirmDelete
          ? 'Delete Group'
          : creating
            ? 'New Group'
            : 'Edit Settings'
      }
      onClose={onClose}
    >
      {confirmDelete ? (
        <div class="notice-content">
          <p>
            Delete <strong>{group.name}</strong> and all its settings?
          </p>
          <div class="dialog-actions">
            <button
              type="button"
              class="block-button"
              ref={backButton}
              onClick={() => setConfirmDelete(false)}
            >
              Back to Editing
            </button>
            <button
              type="button"
              class="block-button remove-setting"
              onClick={event => {
                event.currentTarget.closest('dialog')?.close()
                onDelete(group)
              }}
            >
              Delete Group
            </button>
          </div>
        </div>
      ) : (
        <form
          class="editor-form"
          ref={form}
          noValidate
          onSubmit={event => {
            event.preventDefault()
            const problem = validateGroup(draft)
            setError(problem)
            if (problem) return
            onSave(normalizeGroup(draft))
            event.currentTarget.closest('dialog')?.close()
          }}
        >
          <label>
            Group name
            <input
              value={draft.name}
              onInput={event =>
                setDraft({...draft, name: event.currentTarget.value})
              }
            />
          </label>
          <div class="editor-settings">
            {draft.settings.map((item, index) => (
              <div class="editor-card" key={item.id}>
                <button
                  type="button"
                  class="editor-card-heading"
                  aria-expanded={expanded === item.id}
                  aria-controls={`edit-${item.id}`}
                  onClick={() =>
                    setExpanded(expanded === item.id ? '' : item.id)
                  }
                >
                  <strong>{item.label || `Setting ${index + 1}`}</strong>
                  <span>
                    {typeLabels[item.type]}{' '}
                    <span aria-hidden="true">
                      {expanded === item.id ? '−' : '+'}
                    </span>
                  </span>
                </button>
                <div id={`edit-${item.id}`} hidden={expanded !== item.id}>
                  <SettingEditor
                    item={item}
                    onChange={updated =>
                      setDraft({
                        ...draft,
                        settings: draft.settings.map(setting =>
                          setting.id === item.id ? updated : setting,
                        ),
                      })
                    }
                    onRemove={() =>
                      setDraft({
                        ...draft,
                        settings: draft.settings.filter(
                          setting => setting.id !== item.id,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <fieldset class="add-settings">
            <legend>Add a setting</legend>
            <div class="add-setting-buttons">
              {(Object.keys(typeLabels) as Setting['type'][]).map(type => (
                <button
                  type="button"
                  key={type}
                  class="block-button"
                  onClick={() => {
                    const item = newSetting(type)
                    setDraft({...draft, settings: [...draft.settings, item]})
                    focusNewSetting.current = true
                    setExpanded(item.id)
                  }}
                >
                  + {typeLabels[type]}
                </button>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" class="builder-error">
              {error}
            </p>
          )}
          {!creating && (
            <fieldset class="group-actions">
              <legend>Manage group</legend>
              <div class="add-setting-buttons">
                <button
                  type="button"
                  class="block-button"
                  disabled={draft.settings.length === 0}
                  onClick={() => {
                    setDraft({...draft, settings: []})
                    setExpanded('')
                    setError('')
                  }}
                >
                  Clear Group
                </button>
                <button
                  type="button"
                  class="block-button remove-setting"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Group
                </button>
              </div>
              {draft.settings.length === 0 && group.settings.length > 0 && (
                <p class="clear-status" role="status">
                  Save Settings to remove all controls from this group.
                </p>
              )}
            </fieldset>
          )}
          <div class="dialog-actions">
            <button
              type="button"
              class="block-button"
              onClick={event => event.currentTarget.closest('dialog')?.close()}
            >
              Cancel
            </button>
            <button type="submit" class="block-button primary-button">
              {creating ? 'Create Group' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

export default function SettingsBuilder() {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [editor, setEditor] = useState<{
    group: Group
    creating: boolean
  } | null>(null)
  const [modal, setModal] = useState<ModalContent | null>(null)
  const [storageError, setStorageError] = useState(false)
  const newGroupButton = useRef<HTMLButtonElement>(null)
  const active =
    workspace.groups.find(group => group.id === workspace.activeId) ??
    workspace.groups[0]

  useEffect(() => {
    try {
      setWorkspace(readWorkspace())
    } catch {
      setStorageError(true)
    }
  }, [])

  function save(next: Workspace) {
    setWorkspace(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }

  function replaceGroup(group: Group) {
    const groups: Workspace['groups'] = [...workspace.groups]
    const index = groups.findIndex(item => item.id === group.id)
    if (index === -1) groups.push(group)
    else groups[index] = group
    save({activeId: group.id, groups})
  }

  function deleteGroup(group: Group) {
    const next = removeGroup(workspace, group.id)
    save(next)
    if (next.groups.length === 0) newGroupButton.current?.focus()
  }

  return (
    <div class="settings-builder">
      <div class="settings-workspace">
        <aside class="group-sidebar">
          <h2 id="groups-title">Groups</h2>
          <nav aria-labelledby="groups-title" class="group-list">
            {workspace.groups.map(group => (
              <button
                key={group.id}
                type="button"
                class="group-button"
                aria-current={group.id === active?.id ? 'true' : undefined}
                onClick={() => save({...workspace, activeId: group.id})}
              >
                <span class="group-block" aria-hidden="true" />
                <span class="group-name">{group.name}</span>
                <span
                  class="group-count"
                  aria-label={`${group.settings.length} settings`}
                >
                  {group.settings.length}
                </span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            class="block-button new-group"
            ref={newGroupButton}
            onClick={() =>
              setEditor({
                group: {id: crypto.randomUUID(), name: '', settings: []},
                creating: true,
              })
            }
          >
            + New Group
          </button>
        </aside>
        {active ? (
          <section class="settings-panel" aria-labelledby="group-title">
            <header class="group-header">
              <h2 id="group-title">{active.name}</h2>
              <button
                type="button"
                class="block-button"
                onClick={() => setEditor({group: active, creating: false})}
              >
                Edit Settings
              </button>
            </header>
            <div class="settings-list">
              {active.settings.length === 0 && (
                <p class="empty-group">
                  This group is empty. Use Edit Settings to add a control.
                </p>
              )}
              {active.settings.map(item => (
                <div key={item.id} class="setting-row">
                  <div class="setting-copy">
                    <div class="setting-heading">
                      <h3 id={`label-${item.id}`}>{item.label}</h3>
                      {item.disabled && (
                        <span class="disabled-label">Disabled</span>
                      )}
                    </div>
                    {item.description && (
                      <p id={`description-${item.id}`}>{item.description}</p>
                    )}
                  </div>
                  <div class="setting-control">
                    <SettingControl
                      item={item}
                      onOpen={setModal}
                      onChange={updated => {
                        replaceGroup({
                          ...active,
                          settings: active.settings.map(setting =>
                            setting.id === updated.id ? updated : setting,
                          ),
                        })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section class="settings-panel" aria-labelledby="group-title">
            <header class="group-header">
              <h2 id="group-title">No groups yet</h2>
            </header>
            <div class="settings-list">
              <p class="empty-group">Use New Group to add your first group.</p>
            </div>
          </section>
        )}
      </div>
      <p class="storage-status" role="status">
        <span aria-hidden="true" />
        {storageError
          ? 'Browser storage is unavailable. Changes may be lost on reload.'
          : 'Settings are saved in this browser.'}
      </p>
      {editor && (
        <GroupEditor
          group={editor.group}
          creating={editor.creating}
          onClose={() => setEditor(null)}
          onSave={replaceGroup}
          onDelete={deleteGroup}
        />
      )}
      {modal && (
        <Dialog title={modal.label} onClose={() => setModal(null)}>
          <div class="notice-content">
            <p>{modal.message || 'This is a preview of your modal.'}</p>
            <div class="dialog-actions">
              <button
                type="button"
                class="block-button primary-button"
                onClick={event =>
                  event.currentTarget.closest('dialog')?.close()
                }
              >
                Done
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
