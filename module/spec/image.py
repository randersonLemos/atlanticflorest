import ee
import geemap
import warnings

class Image:
    def __init__(self, eeimage):
        if isinstance(eeimage, str):
            self.eeimage = ee.Image(eeimage)

        elif isinstance(eeimage, ee.Image):
            self.eeimage = eeimage

        else:
            raise TypeError


        self.loadBandNames = []


    def loadBands(self, bandNames=[]):
        if bandNames:
            for bandName in bandNames:
                if bandName not in self.bandNames():
                    raise ValueError(f"Band {bandName} not found in {self.bandNames}")

        else:
            bandNames = self.bandNames()


        for bandName in bandNames:
            attr = f"b{bandName}"
            if hasattr(self, attr):
                continue
            setattr(self, attr, Image(self.eeimage.select(bandName)))
            self.loadBandNames.append(bandName)


    def getBands(self):
       if self.loadBandNames:
           return self._getBands()
       else: 
           print(f"[WARN]No loaded Bands!")

    def _getBands(self):
        for bandName in self.loadBandNames:
            empty = False
            attr = f"b{bandName}"
            yield getattr(self, attr)
 


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

