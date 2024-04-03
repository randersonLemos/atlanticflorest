import ee
import geemap

from module.spec.image import Image
from module.spec.visualization import Visualization
from module.visualizations import mapbiomes
from module import names


class Map(Image, Visualization):
     def __init__(self, eeimage, palette, minVal, maxVal):
        Image.__init__(self, eeimage)
        Visualization.__init__(self, palette, minVal, maxVal)


     def add_layer(self, geeMap, layerName='', center=True):
        empty = True                
        for en, band in enumerate(self.getBands()):
            empty = False
            shown = True if len(self.loadBandNames) == (en+1) else False
            
            bandName = band.bandNames()[-1]
            Visualization.add_layer(self, band.eeimage, bandName, geeMap, shown, center)

        if empty:
            print(f"[WARN]No loaded Bands!")


class LULC(Map):
    def __init__(self, eeimage, palette=[], minVal=0, maxVal=255):
        Map.__init__(self, eeimage, palette, minVal, maxVal)


class Brazil(LULC):
    def __init__(self):
        LULC.__init__(
              self
            , names.Images.BRAZIL_LULC.value      
            , mapbiomes['palette']
            , mapbiomes['min']
            , mapbiomes['max']
        )
