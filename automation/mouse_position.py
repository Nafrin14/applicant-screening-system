import pyautogui
import time

print("Move mouse to WhatsApp Search box...")
print("Position will show in 5 seconds")

time.sleep(5)

x, y = pyautogui.position()
print("Mouse position:", x, y)