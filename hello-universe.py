import ee
import geemap
import pprint

from classes.image import BrazilImage
from classes.image import CanopyImage

from classes.feature import AtlanticForestFeature


# Trigger the authentication flow.
ee.Authenticate()

# Initialize the library.
ee.Initialize(project='ee-mataatlantica')


if __name__ == '__main__':
    brazil = BrazilImage()
    canopy = CanopyImage()
    atlanc = AtlanticForestFeature()

    Map = geemap.Map()

    import IPython; IPython.embed()
