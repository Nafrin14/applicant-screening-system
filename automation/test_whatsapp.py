from pywinauto import Application

try:
    app = Application(backend="uia").connect(title_re=".*WhatsApp.*")
    window = app.top_window()
    window.set_focus()
    print("WhatsApp focused successfully")
except Exception as e:
    print(e)