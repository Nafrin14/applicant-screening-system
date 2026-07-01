from pywinauto import Application
import pyautogui
import pyperclip
import time
import sys
import json

data_path = sys.argv[1]

with open(data_path, "r", encoding="utf-8") as file:
    data = json.load(file)

contact_name = data["contactName"]
items = data["items"]


def find_image(image, confidence=0.6, timeout=15):
    start = time.time()

    while time.time() - start < timeout:
        try:
            pos = pyautogui.locateCenterOnScreen(
                image,
                confidence=confidence
            )

            if pos:
                return pos

        except Exception:
            pass

        time.sleep(0.5)

    return None


# Focus WhatsApp
app = Application(backend="uia").connect(
    title_re=".*WhatsApp.*"
)

window = app.top_window()
window.set_focus()

time.sleep(2)

# Search contact
search = find_image(
    "images/search_box.png",
    0.35
)

if not search:
    print("Search box not found")
    sys.exit()

pyautogui.click(search)
time.sleep(1)

pyautogui.hotkey("ctrl", "a")
time.sleep(0.3)

pyautogui.press("backspace")
time.sleep(0.5)

pyperclip.copy(contact_name)
pyautogui.hotkey("ctrl", "v")
time.sleep(3)

pyautogui.press("enter")
time.sleep(2)
# Verify correct WhatsApp group
 #time.sleep(2)

#group_found = find_image(
 #   "images/testing_group.png",
   # confidence=0.8,
    #timeout=5
#)

#if not group_found:
 #   print("Wrong WhatsApp group opened. Automation stopped.")
  #  sys.exit()

#print("Correct WhatsApp group verified.")



for item in items:
    # Click plus button
    plus = find_image(
        "images/plus_button.png",
        0.7
    )

    if not plus:
        print("Plus button not found")
        continue

    pyautogui.click(plus)
    time.sleep(1)

    # Click document button
    document = find_image(
        "images/document_button.png",
        0.7
    )

    if not document:
        print("Document button not found")
        continue

    pyautogui.click(document)
    time.sleep(1)

    # Select PDF
    pyperclip.copy(item["pdfPath"])
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1)

    pyautogui.press("enter")
    time.sleep(4)

    # Add candidate details as PDF caption
    pyperclip.copy(item["message"])
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1)

      # Send PDF with caption
    time.sleep(2)

    pyautogui.press("enter")
    print("Send key pressed:", item["pdfPath"])

    time.sleep(6)

    plus_back = find_image(
        "images/plus_button.png",
        0.7,
        timeout=30
    )

    if not plus_back:
        print("PDF not sent properly. Automation stopped.")
        sys.exit()

    print("PDF sent successfully:", item["pdfPath"])
    time.sleep(3)