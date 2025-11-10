import sys
from PyQt5.QtWidgets import QApplication, QWidget, QGridLayout, QPushButton, QLabel, QLineEdit
from PyQt5.QtCore import Qt
import random

class BlackJackWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.player_money = 1000
        self.player_hand = 0
        self.dealer_hand = 0
        self.cards = ("2", "3", "4", "5", "6", "7", "8", "9", "10", "10", "10", "10", "A")
        self.hit = QPushButton("Hit", self)
        self.hit.setEnabled(False)
        self.stand = QPushButton("Stand", self)
        self.stand.setEnabled(False)
        self.start = QPushButton("Start", self)
        self.money = QLabel(f"Money: {self.player_money}", self)
        self.bet = QLineEdit(self)
        self.bet.setPlaceholderText("Enter Bet Amount")
        self.player_hand_label = QLabel(f"Player Hand: {self.player_hand}", self)
        self.dealer_hand_label = QLabel(f"Dealer Hand: {self.dealer_hand}", self)
        self.initUI()


    def initUI(self):
        self.setWindowTitle("Blackjack")
        self.setGeometry(600, 100, 700, 700)
        layout = QGridLayout()
        layout.addWidget(self.money, 0, 0)
        layout.addWidget(self.bet, 0, 1)
        layout.addWidget(self.dealer_hand_label, 1, 0)
        layout.addWidget(self.player_hand_label, 2, 0)
        layout.addWidget(self.hit, 3, 0)
        layout.addWidget(self.stand, 3, 1)
        layout.addWidget(self.start, 4, 0, 1, 2)
        self.setStyleSheet("""
            QPushButton {
                font-size: 20px;
                padding: 10px;
            }
            QLabel {
                font-size: 18px;
            }
            QLineEdit {
                font-size: 18px;
                padding: 5px;
            }
        """)
        self.hit.setMinimumWidth(400)
        self.stand.setMinimumWidth(400)
        self.hit.setMaximumWidth(400)
        self.stand.setMaximumWidth(400)

        self.player_hand_label.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self.dealer_hand_label.setAlignment(Qt.AlignRight | Qt.AlignVCenter)

        self.bet.setMaximumWidth(400)
        self.bet.setAlignment(Qt.AlignLeft)
        
        self.hit.setSizePolicy(self.stand.sizePolicy())
        self.setLayout(layout)
        
        self.hit.clicked.connect(self.hit_card)
        self.stand.clicked.connect(self.stand_game)
        self.start.clicked.connect(self.start_game)

    def dealer_cards(self):
        self.dealer_hand = random.randint(4, 21)
        if 4 <= self.dealer_hand <= 9:
            self.dealer_hand_label.setText(f"0{self.dealer_hand}")

    def dealer_new_card(self):
        new_card_dealer = random.choice(self.cards)
        if new_card_dealer == "A":
            self.dealer_hand += 11 if self.dealer_hand <= 10 else 1
        else:
            self.dealer_hand += int(new_card_dealer)

        self.update_labels()
    
    def player_cards(self):
        self.player_hand = random.randint(4, 21)
        if 4 <= self.player_hand <= 9:
            self.player_hand_label.setText(f"0{self.player_hand}")

    def win(self):
        if self.player_hand > 21:
            return
        if self.dealer_hand > 21 or self.player_hand > self.dealer_hand:
            self.player_money += int(self.bet.text()) * 2
        elif self.player_hand == self.dealer_hand:
            self.player_money += int(self.bet.text())
        self.update_labels()
        self.stand.setEnabled(False)
        self.hit.setEnabled(False)
        self.start.setEnabled(True)
        self.bet.setEnabled(True)

    def hit_card(self):
        
        new_card = random.choice(self.cards)
        if new_card == "A":
            self.player_hand += 11 if self.player_hand <= 10 else 1
        else:
            self.player_hand += int(new_card)

        self.update_labels()


        

    
    def stand_game(self):
        while self.dealer_hand < 17:
            self.dealer_new_card()
        self.win()



    def start_game(self):
        if self.player_money <= 0:
            self.player_hand_label.setText("You are out of money!")
            return
        if not self.bet.text().isdigit() or int(self.bet.text()) <= 0:
            self.player_hand_label.setText("Please enter a valid bet amount.")
            return
        if int(self.bet.text()) > self.player_money:
            self.player_hand_label.setText("Insufficient funds for this bet.")
            return
        self.player_money -= int(self.bet.text())
        self.dealer_cards()
        self.player_cards()
        self.update_labels()
        self.start.setEnabled(False)
        self.bet.setEnabled(False)
        self.stand.setEnabled(True)
        self.hit.setEnabled(True)


    def update_labels(self):
        self.money.setText(f"Money: {self.player_money}")
        self.player_hand_label.setText(f"Player Hand: {self.player_hand}")
        self.dealer_hand_label.setText(f"Dealer Hand: {self.dealer_hand}")
        
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BlackJackWindow()
    window.show()
    sys.exit(app.exec_())