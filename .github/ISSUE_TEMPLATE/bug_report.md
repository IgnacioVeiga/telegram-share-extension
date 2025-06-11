name: Bug Report
description: Report a problem you encountered with the extension.
title: "[Bug] "
labels: ["bug"]

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report this issue!
  - type: textarea
    id: description
    attributes:
      label: Describe the issue
      description: What happened? What did you expect to happen?
      placeholder: Describe the bug clearly and concisely.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: How can we reproduce the problem?
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Extension version
      placeholder: e.g. 1.0.1
    validations:
      required: false
  - type: textarea
    id: logs
    attributes:
      label: Console logs (if any)
      description: Copy relevant logs from the browser console.
      render: shell
    validations:
      required: false
