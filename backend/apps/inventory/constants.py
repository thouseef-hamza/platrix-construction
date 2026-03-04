"""Constants for inventory app."""

# Material unit values (IntegerField)
UNIT_PIECE = 0
UNIT_KG = 1
UNIT_METER = 2
UNIT_LITER = 3
UNIT_BOX = 4
UNIT_SQM = 5  # square meter
UNIT_CUBIC_METER = 6
UNIT_ROLL = 7
UNIT_SET = 8
UNIT_OTHER = 9

UNIT_CHOICES = [
    (UNIT_PIECE, "Piece"),
    (UNIT_KG, "Kg"),
    (UNIT_METER, "Meter"),
    (UNIT_LITER, "Liter"),
    (UNIT_BOX, "Box"),
    (UNIT_SQM, "Sq. meter"),
    (UNIT_CUBIC_METER, "Cubic meter"),
    (UNIT_ROLL, "Roll"),
    (UNIT_SET, "Set"),
    (UNIT_OTHER, "Other"),
]
