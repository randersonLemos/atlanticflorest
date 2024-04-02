import ee
import geemap

from module.spec.image import Image

class CanopyHeight(Image):
    def __init__(self, eeimage):
        Image.__init__(self, eeimage)


url = 'users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1'
class Brazil(CanopyHeight):
    def __init__( self, eeimage=url ):
        CanopyHeight.__init__(self, eeimage)
