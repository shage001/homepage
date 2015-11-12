'''
Sam Hage
Is it greek night?
11/2015
'''

import urllib2

USER_AGENT = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.472.63 Safari/534.3'

def main():
	"""
	**********************************************************************************************************************
	Code to run on program execution.
	"""
	get_static_html()


def get_static_html():
	"""
	**********************************************************************************************************************
	Write the source of http://menus.middlebury.edu to a file. This will be run once per day
	"""
	## request the resource using boilerplate found on Stack Overflow once upon a time ##
	try:
		headers = { 'User-Agent' : USER_AGENT }
		request = urllib2.Request( 'http://menus.middlebury.edu/', None, headers )
		response = urllib2.urlopen( request )
		page_source = response.read()

	except:
		print( 'Resource error' )

	out_file = open( 'today.txt', 'w' )
	out_file.write( page_source )
	out_file.close()
	

if __name__ == '__main__':
	main()


















