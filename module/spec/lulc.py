import ee
import geemap

from module.spec.image import Image


class LULC(Image):
    def __init__(self, eeimage):
        Image.__init__(self, eeimage)


url = 'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
class Brazil(LULC):
    def __init__(self, eeimage = url):
        LULC.__init__(self, eeimage)
