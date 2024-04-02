import ee
import geemap

class Image:
    def __init__(self, eeimage):
        if isinstance(eeimage, str):
            self.eeimage = ee.Image(eeimage)

        elif isinstance(eeimage, ee.Image):
            self.eeimage = eeimage

        else:
            raise TypeError


    def bandNames(self):
        attr = '_bandNames'
        if hasattr(self, attr):
            return getattr(self, attr)

        setattr(self, attr, self.eeimage.bandNames().getInfo())
        return getattr(self, attr)


    def getInfo(self):
        attr = '_getInfo'
        if hasattr(self, attr):
            return getattr(self, attr)

        setattr(self, attr, self.eeimage.getInfo())
        return getattr(self, attr)


    def crs(self):
        raise NotImplementedError

