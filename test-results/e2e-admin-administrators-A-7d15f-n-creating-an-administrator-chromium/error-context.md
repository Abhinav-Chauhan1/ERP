# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "SikshaMitra" [level=1] [ref=e6]
      - paragraph [ref=e7]: Manage your school effectively
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Sign In" [level=3] [ref=e11]
        - paragraph [ref=e12]: Access your school dashboard
      - generic [ref=e14]:
        - generic [ref=e15]:
          - img [ref=e16]
          - heading "Enter School Code" [level=2] [ref=e21]
          - paragraph [ref=e22]: Please enter your school code to continue
        - generic [ref=e23]:
          - text: School Code
          - textbox "School Code" [ref=e24]:
            - /placeholder: Enter your school code
            - text: TEST-INTL
          - paragraph [ref=e25]: Invalid school code. Please check and try again.
        - button "Continue" [ref=e26] [cursor=pointer]
      - generic [ref=e28]:
        - text: Super Admin?
        - link "Sign in here" [ref=e29] [cursor=pointer]:
          - /url: /sd
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]:
    - img [ref=e36]
  - alert [ref=e39]
```