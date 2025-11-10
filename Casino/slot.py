import sys
from PyQt5.QtWidgets import QApplication, QPushButton, QLabel, QGridLayout, QWidget, QLineEdit
import random
from PyQt5.QtGui import QIntValidator

class Window(QWidget):
    amount = 100
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Slot Machine")
        self.setGeometry(600, 100, 700, 700)
        self.spin_button = QPushButton("Spin", self)
        self.slot = QLabel("Welcome to the Slot Machine!", self)
        self.amount = 100
        self.money = QLabel(f"Money: ${self.amount}", self)
        self.bet_amount = QLineEdit(self)
        self.bet_amount.setValidator(QIntValidator(1, 2147483647, self))
        self.bet_amount.setPlaceholderText("Enter Bet ...")
        self.initUI()
        
    def initUI(self):
        layout = QGridLayout()
        layout.setSpacing(0)
        layout.setContentsMargins(20, 0, 20, 10)
        layout.addWidget(self.slot, 1, 1)
        layout.addWidget(self.bet_amount, 0, 2)
        layout.addWidget(self.money, 0, 0)
        layout.addWidget(self.spin_button, 2, 0, 1, 3)

        self.setLayout(layout)
        
        self.slot.setObjectName("slot")
        self.money.setObjectName("money")
        
        self.setStyleSheet("""
            QLineEdit {
                font-size: 20px;
                font-family: Arial;
            }
            QPushButton {
                font-size: 30px;
                padding: 16px ;

            }

            QLabel#money {
                font-size: 24px;
            }
        """)
        self.slot.setStyleSheet("font-size: 24px;")
        
        self.spin_button.clicked.connect(self.spin)
    
    def spin(self):
        self.bet = int(self.bet_amount.text())  
        if self.bet > self.amount:
            self.slot.setStyleSheet("font-size: 24px;")
            self.slot.setText("Insufficient funds!")
            return
        
        self.amount = self.amount - int(self.bet_amount.text())
        self.money.setText(f"Money: ${self.amount}")
        self.symbols = {"🍒": 2, "🍋": 3, "🍊" : 4, "🍉" : 5, "🍇": 6, "🍓": 10}
        self.results = [random.choice(list(self.symbols.keys())) for _ in range(3)]
        self.update_display()
        

    def update_display(self):
        self.slot.setStyleSheet("font-size: 100px;")
        self.slot.setText(f"{self.results[0]} | {self.results[1]} | {self.results[2]}")
        self.win()
    


    def win(self):
        
        match self.results:
            case [a, b, c] if a == b == c:
                win_amount = self.bet * self.symbols[a]
                self.amount += win_amount
            case [a, b, c] if a == b or a == c:
                win_amount = self.bet * self.symbols[a]
                self.amount += win_amount / 3
            case [a, b, c] if b == c:
                win_amount = self.bet * self.symbols[b]
                self.amount += win_amount / 3

        self.amount = round(self.amount)
        self.money.setText(f"Money: ${self.amount}")



       

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = Window()
    window.show()
    sys.exit(app.exec_())
        
