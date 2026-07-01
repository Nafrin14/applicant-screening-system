from pywinauto import Application

app = Application(backend="uia").connect(title_re=".*WhatsApp.*")
window = app.top_window()

window.print_control_identifiers()