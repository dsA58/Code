import sys
from PyQt5.QtWidgets import QApplication, QWidget, QGridLayout, QPushButton, QLabel, QLineEdit
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QPixmap, QPainter
import random

class BlackJackWindow(QWidget):
    def __init__(self):
        super().__init__()

        self.player_money = 1000
        self.player_hand = 0
        self.dealer_hand = 0
        self.cards = ("2", "3", "4", "5", "6", "7", "8", "9", "10", "10", "10", "10", "Ace")

        self.hit = QPushButton("Hit", self)
        self.hit.setEnabled(False)
        self.stand = QPushButton("Stand", self)
        self.stand.setEnabled(False)
        self.start = QPushButton("Start", self)

        self.money = QLabel(f"Money: {self.player_money}", self)
        self.bet = QLineEdit(self)
        self.bet.setPlaceholderText("Enter Bet Amount")

        self.player_hand_image = QLabel(self)
        self.player_hand_image_new = QLabel(self)
        self.dealer_hand_image = QLabel(self)
        self.dealer_hand_image_new = QLabel(self)
        
        self.status = QLabel(self)

        self.initUI()

    def initUI(self):
        self.setWindowTitle("Blackjack")
        self.setGeometry(600, 100, 700, 700)

        layout = QGridLayout()
        layout.addWidget(self.money, 0, 0)
        layout.addWidget(self.bet, 0, 1)
        layout.addWidget(self.dealer_hand_image, 1, 0)
        layout.addWidget(self.player_hand_image, 2, 0)
        layout.addWidget(self.dealer_hand_image_new, 1, 1)
        layout.addWidget(self.player_hand_image_new, 2, 1)

        layout.addWidget(self.hit, 3, 0)
        layout.addWidget(self.stand, 3, 1)
        layout.addWidget(self.start, 4, 0, 1, 2)
        layout.addWidget(self.status, 5, 0, 1, 2)

        self.status.setObjectName("status")

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
            QLabel#status {
                font-size: 20px;
                max-height: 20px;
            }
        """)

        self.hit.setMinimumWidth(400)
        self.stand.setMinimumWidth(400)
        self.hit.setMaximumWidth(400)
        self.stand.setMaximumWidth(400)

        self.player_hand_image.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self.dealer_hand_image.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self.bet.setMaximumWidth(400)
        self.bet.setAlignment(Qt.AlignLeft)

        self.hit.setSizePolicy(self.stand.sizePolicy())
        self.setLayout(layout)

        self.hit.clicked.connect(self.hit_card)
        self.stand.clicked.connect(self.stand_game)
        self.start.clicked.connect(self.start_game)

    def dealer_cards(self):
        self.first_dealer_card = random.choice(self.cards)
        self.hidden_dealer_card = random.choice(self.cards)
        self.dealer_hand = 0
        for card in (self.first_dealer_card, self.hidden_dealer_card):
            if card == "Ace":
                self.dealer_hand += 11 if self.dealer_hand <= 10 else 1
            else:
                self.dealer_hand += int(card)
        self.pixmap1 = self.picture(self.first_dealer_card)
        self.pixmap2 = self.picture("red_joker")

        self.dealer_pixmaps = [self.pixmap1, self.pixmap2]
        self.load_picture(*self.dealer_pixmaps, player="dealer")
        if self.pixmap2 in self.dealer_pixmaps:
            self.dealer_pixmaps.remove(self.pixmap2)

    def dealer_new_card(self):
        new_card_dealer = random.choice(self.cards)
        if new_card_dealer == "Ace":
            self.dealer_hand += 11 if self.dealer_hand <= 10 else 1
        else:
            self.dealer_hand += int(new_card_dealer)
        
        new_pixmap = self.picture(new_card_dealer)
        self.dealer_pixmaps_new.append(new_pixmap)
        self.load_picture(*self.dealer_pixmaps_new, player="dealer_new")

        self.update_labels()

    def player_cards(self):
        self.first_player_card = random.choice(self.cards)
        self.second_player_card = random.choice(self.cards)
        self.player_hand = 0
        for card in (self.first_player_card, self.second_player_card):
            if card == "Ace":
                self.player_hand += 11 if self.player_hand <= 10 else 1
            else:
                self.player_hand += int(card)

        self.pixmap1 = self.picture(self.first_player_card)
        self.pixmap2 = self.picture(self.second_player_card)
        
        self.player_pixmaps = [self.pixmap1, self.pixmap2]
        self.load_picture(*self.player_pixmaps, player="player")

    def hit_card(self):
        new_card = random.choice(self.cards)
        if new_card == "Ace":
            self.player_hand += 11 if self.player_hand <= 10 else 1
        else:
            self.player_hand += int(new_card)

        new_pixmap = self.picture(new_card)
        self.player_pixmaps_new.append(new_pixmap)
        self.load_picture(*self.player_pixmaps_new, player="player_new")

        if self.player_hand >= 21:
            self.win()
            return

        self.update_labels()

    def stand_game(self):
        hidden_pixmap = self.picture(self.hidden_dealer_card)
        self.dealer_pixmaps.append(hidden_pixmap)
        self.load_picture(*self.dealer_pixmaps, player="dealer")
        
        while self.dealer_hand < self.player_hand:
            self.dealer_new_card()
        self.win()

    def start_game(self):
        self.status.setText("")
        self.player_pixmaps_new = []
        self.dealer_pixmaps_new = []
        
        self.player_hand_image.clear()
        self.player_hand_image_new.clear()
        self.dealer_hand_image.clear()
        self.dealer_hand_image_new.clear()
        
        if self.player_money <= 0:
            self.player_hand_image.setText("You are out of money!")
            return
        if not self.bet.text().isdigit() or int(self.bet.text()) <= 0:
            self.player_hand_image.setText("Please enter a valid bet amount.")
            return
        if int(self.bet.text()) > self.player_money:
            self.player_hand_image.setText("Insufficient funds for this bet.")
            return

        self.player_money -= int(self.bet.text())
        self.dealer_cards()
        self.player_cards()
        self.update_labels()
        self.start.setEnabled(False)
        self.bet.setEnabled(False)
        self.stand.setEnabled(True)
        self.hit.setEnabled(True)

    def win(self):
        if self.player_hand > 21:
            self.status.setText("You busted! Dealer wins.")
            self.stand.setEnabled(False)
            self.hit.setEnabled(False)
            self.start.setEnabled(True)
            self.bet.setEnabled(True)
            return
        elif self.dealer_hand > 21 or self.player_hand > self.dealer_hand:
            self.player_money += int(self.bet.text()) * 2
            self.status.setText("You win!")
        elif self.player_hand == self.dealer_hand:
            self.player_money += int(self.bet.text())
            self.status.setText("It's a tie!")
        else:
            self.status.setText("Dealer wins!")
        self.update_labels()
        self.stand.setEnabled(False)
        self.hit.setEnabled(False)
        self.start.setEnabled(True)
        self.bet.setEnabled(True)

    def picture(self, card):
        suits = ["hearts", "diamonds", "clubs", "spades"]
        face = ["jack", "queen", "king"]
        if card == "10":
            card = random.choice(face)  
        if card == "red_joker":
            pixmap = QPixmap("C:\\Users\\ErikG\\OneDrive\\Desktop\\Code\\Casino\\black_jack\\PNG-cards-1.3\\red_joker.png")
            return pixmap.scaled(100, 150, Qt.KeepAspectRatio)
        suit = random.choice(suits)
        pixmap = QPixmap(f"C:\\Users\\ErikG\\OneDrive\\Desktop\\Code\\Casino\\black_jack\\PNG-cards-1.3\\{card}_of_{suit}.png")
        return pixmap.scaled(100, 150, Qt.KeepAspectRatio)

    
    def load_picture(self, *pixmaps, player):
        card_width = 100
        spacing = 10
        total_width = len(pixmaps) * (card_width + spacing) - spacing
        height = 150

        combined = QPixmap(total_width, height)
        combined.fill(Qt.transparent)

        painter = QPainter(combined)
        x = 0
        for pixmap in pixmaps:
            if not pixmap.isNull():
                scaled = pixmap.scaled(card_width, height, Qt.KeepAspectRatio)
                painter.drawPixmap(x, 0, scaled)
                x += card_width + spacing
        painter.end()

        if player == "player":
            self.player_hand_image.setPixmap(combined)
        elif player == "dealer":
            self.dealer_hand_image.setPixmap(combined)
        elif player == "player_new":
            self.player_hand_image_new.setPixmap(combined)
        elif player == "dealer_new":
            self.dealer_hand_image_new.setPixmap(combined)

    def update_labels(self):
        self.money.setText(f"Money: {self.player_money}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BlackJackWindow()
    window.show()
    sys.exit(app.exec_())
